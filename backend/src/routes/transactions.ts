import type { FastifyInstance } from "fastify";
import { prisma } from "../db";
type CreateTransactionBody = {
  monthId: string;
  date: string; // YYYY-MM-DD
  amount: number; // > 0
  description: string;
  paymentMethodId: string;
  categoryId?: string; // opcional => default "No identificado"
  note?: string;
  isReconciled?: boolean;
};

type UpdateTransactionBody = {
  categoryId?: string;
  note?: string | null;
  isReconciled?: boolean;
  description?: string;
  date?: string; // YYYY-MM-DD
  paymentMethodId?: string;
};


function isValidISODateOnly(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Busca la categoría "No identificado" (seed) para usarla como default
async function getUnidentifiedCategoryId() {
  const cat = await prisma.category.findFirst({
    where: { name: "No identificado", isActive: true },
    select: { id: true },
  });
  if (!cat) throw new Error('Missing seed category: "No identificado"');
  return cat.id;
}

export async function transactionsRoutes(app: FastifyInstance) {
  // POST /transactions
  app.post<{ Body: CreateTransactionBody }>("/transactions", async (req, reply) => {
    const body = req.body ?? ({} as CreateTransactionBody);
    const { monthId, date, amount, description, paymentMethodId, categoryId, note, isReconciled } = body;

    if (!monthId || typeof monthId !== "string") {
      return reply.status(400).send({ error: "monthId is required" });
    }
    if (!date || typeof date !== "string" || !isValidISODateOnly(date)) {
      return reply.status(400).send({ error: "date must be YYYY-MM-DD" });
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return reply.status(400).send({ error: "amount must be a number > 0" });
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return reply.status(400).send({ error: "description is required" });
    }
    if (!paymentMethodId || typeof paymentMethodId !== "string") {
      return reply.status(400).send({ error: "paymentMethodId is required" });
    }

    const month = await prisma.month.findUnique({ where: { id: monthId } });
    if (!month) return reply.status(404).send({ error: "month not found" });

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
      select: { id: true, isActive: true },
    });
    if (!paymentMethod) return reply.status(404).send({ error: "payment method not found" });
    if (!paymentMethod.isActive) {
      return reply.status(400).send({ error: "payment method is not active" });
    }

    let finalCategoryId = categoryId;

    if (finalCategoryId) {
      const cat = await prisma.category.findUnique({ where: { id: finalCategoryId } });
      if (!cat) return reply.status(404).send({ error: "category not found" });
      if (!cat.isActive) return reply.status(400).send({ error: "category is not active" });
    } else {
      finalCategoryId = await getUnidentifiedCategoryId();
    }

    const created = await prisma.transaction.create({
      data: {
        monthId,
        date: new Date(date),
        amount,
        description: description.trim(),
        paymentMethodId,
        categoryId: finalCategoryId,
        note: note?.trim() || null,
        isReconciled: typeof isReconciled === "boolean" ? isReconciled : false,
      },
      include: { category: { include: { group: true } }, paymentMethod: true },
    });

    return reply.status(201).send(created);
  });

  // GET /months/:monthId/transactions
  app.get<{ Params: { monthId: string } }>("/months/:monthId/transactions", async (req, reply) => {
    const { monthId } = req.params;

    const month = await prisma.month.findUnique({ where: { id: monthId } });
    if (!month) return reply.status(404).send({ error: "month not found" });

    const transactions = await prisma.transaction.findMany({
      where: { monthId },
      include: { category: { include: { group: true } }, paymentMethod: true },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    return { month, transactions };
  });

  // GET /months/:monthId/unidentified
  app.get<{ Params: { monthId: string } }>(
    "/months/:monthId/unidentified",
    async (req, reply) => {
      const { monthId } = req.params;

      const month = await prisma.month.findUnique({ where: { id: monthId } });
      if (!month) return reply.status(404).send({ error: "month not found" });

      const unidentifiedCategoryId = await getUnidentifiedCategoryId();

      const transactions = await prisma.transaction.findMany({
        where: { monthId, categoryId: unidentifiedCategoryId },
        include: { category: { include: { group: true } }, paymentMethod: true },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      });

      return { month, transactions };
    }
  );

// PATCH /transactions/:id
app.patch<{ Params: { id: string }; Body: UpdateTransactionBody }>(
  "/transactions/:id",
  async (req, reply) => {
    const { id } = req.params;
    const body = req.body ?? ({} as UpdateTransactionBody);

    // Verificar que exista
    const existing = await prisma.transaction.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existing) return reply.status(404).send({ error: "transaction not found" });

    // Validar categoryId (si viene)
    if (body.categoryId !== undefined) {
      if (body.categoryId === null || body.categoryId === "") {
        return reply.status(400).send({ error: "categoryId must be a non-empty string" });
      }
      const cat = await prisma.category.findUnique({ where: { id: body.categoryId } });
      if (!cat) return reply.status(404).send({ error: "category not found" });
      if (!cat.isActive) return reply.status(400).send({ error: "category is not active" });
    }

    if (body.date !== undefined) {
      if (typeof body.date !== "string" || !isValidISODateOnly(body.date)) {
        return reply.status(400).send({ error: "date must be YYYY-MM-DD" });
      }
    }

    if (body.paymentMethodId !== undefined) {
      if (typeof body.paymentMethodId !== "string" || !body.paymentMethodId.trim()) {
        return reply.status(400).send({ error: "paymentMethodId must be a non-empty string" });
      }
      const pm = await prisma.paymentMethod.findUnique({
        where: { id: body.paymentMethodId },
        select: { id: true, isActive: true },
      });
      if (!pm) return reply.status(404).send({ error: "payment method not found" });
      if (!pm.isActive) return reply.status(400).send({ error: "payment method is not active" });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        categoryId: body.categoryId,
        paymentMethodId: body.paymentMethodId,
        isReconciled: typeof body.isReconciled === "boolean" ? body.isReconciled : undefined,
        note: body.note === undefined ? undefined : body.note?.trim() ?? null,
        description:
          body.description === undefined ? undefined : body.description.trim(),
        date: body.date === undefined ? undefined : new Date(body.date),
      },
      include: { category: { include: { group: true } }, paymentMethod: true },
    });

    return updated;
  }
);

// DELETE /transactions/:id
app.delete<{ Params: { id: string } }>("/transactions/:id", async (req, reply) => {
  const { id } = req.params;

  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) return reply.status(404).send({ error: "transaction not found" });

  await prisma.transaction.delete({ where: { id } });
  return reply.status(204).send();
});



}
