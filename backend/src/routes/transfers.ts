import type { FastifyInstance } from "fastify";
import { prisma } from "../db";

type CreateTransferBody = {
  monthId: string;
  date: string; // YYYY-MM-DD
  amount: number; // > 0
  fromPaymentMethodId: string;
  toPaymentMethodId: string;
  description?: string;
  note?: string;
};

function isValidISODateOnly(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

async function getTransferCategoryId() {
  const cat = await prisma.category.findFirst({
    where: { name: "Transferencias", isActive: true },
    select: { id: true },
  });
  if (!cat) throw new Error('Missing seed category: "Transferencias"');
  return cat.id;
}

export async function transfersRoutes(app: FastifyInstance) {
  // POST /transfers
  app.post<{ Body: CreateTransferBody }>("/transfers", async (req, reply) => {
    const body = req.body ?? ({} as CreateTransferBody);
    const {
      monthId,
      date,
      amount,
      fromPaymentMethodId,
      toPaymentMethodId,
      description,
      note,
    } = body;

    if (!monthId || typeof monthId !== "string") {
      return reply.status(400).send({ error: "monthId is required" });
    }
    if (!date || typeof date !== "string" || !isValidISODateOnly(date)) {
      return reply.status(400).send({ error: "date must be YYYY-MM-DD" });
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return reply.status(400).send({ error: "amount must be a number > 0" });
    }
    if (!fromPaymentMethodId || typeof fromPaymentMethodId !== "string") {
      return reply.status(400).send({ error: "fromPaymentMethodId is required" });
    }
    if (!toPaymentMethodId || typeof toPaymentMethodId !== "string") {
      return reply.status(400).send({ error: "toPaymentMethodId is required" });
    }
    if (fromPaymentMethodId === toPaymentMethodId) {
      return reply.status(400).send({ error: "from and to must be different" });
    }

    const month = await prisma.month.findUnique({ where: { id: monthId } });
    if (!month) return reply.status(404).send({ error: "month not found" });

    const [fromPm, toPm] = await Promise.all([
      prisma.paymentMethod.findUnique({
        where: { id: fromPaymentMethodId },
        select: { id: true, name: true, isActive: true, type: true },
      }),
      prisma.paymentMethod.findUnique({
        where: { id: toPaymentMethodId },
        select: { id: true, name: true, isActive: true, type: true },
      }),
    ]);
    if (!fromPm || !toPm) {
      return reply.status(404).send({ error: "payment method not found" });
    }
    if (!fromPm.isActive || !toPm.isActive) {
      return reply.status(400).send({ error: "payment method is not active" });
    }
    if (fromPm.type === "CREDIT" || toPm.type === "CREDIT") {
      return reply.status(400).send({ error: "transfer only supports CASH/DEBIT" });
    }

    const transferCategoryId = await getTransferCategoryId();
    const txDescription =
      description?.trim() || `Transferencia a ${toPm.name}`;
    const incomeSource =
      description?.trim() || `Transferencia desde ${fromPm.name}`;

    const [expenseTx, income] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          monthId,
          date: new Date(date),
          amount,
          description: txDescription,
          paymentMethodId: fromPaymentMethodId,
          categoryId: transferCategoryId,
          note: note?.trim() || null,
          isReconciled: false,
        },
        include: { category: { include: { group: true } }, paymentMethod: true },
      }),
      prisma.income.create({
        data: {
          monthId,
          date: new Date(date),
          amount,
          source: incomeSource,
          note: note?.trim() || null,
          paymentMethodId: toPaymentMethodId,
          isTransfer: true,
        },
        include: { paymentMethod: true },
      }),
    ]);

    return reply.status(201).send({ expenseTx, income });
  });
}
