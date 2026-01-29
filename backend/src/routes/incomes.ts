import type { FastifyInstance } from "fastify";
import { prisma } from "../db";

type CreateIncomeBody = {
  monthId: string;
  date: string;   // "YYYY-MM-DD"
  amount: number; // > 0
  source?: string;
  note?: string;
  paymentMethodId?: string;
};

type UpdateIncomeBody = {
  date?: string; // "YYYY-MM-DD"
  amount?: number; // > 0
  paymentMethodId?: string | null;
};

function isValidISODateOnly(s: string) {
  // Minimal: YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function incomesRoutes(app: FastifyInstance) {
  // POST /incomes
  app.post<{ Body: CreateIncomeBody }>("/incomes", async (req, reply) => {
    const body = req.body ?? ({} as CreateIncomeBody);
    const { monthId, date, amount, source, note, paymentMethodId } = body;

    if (!monthId || typeof monthId !== "string") {
      return reply.status(400).send({ error: "monthId is required" });
    }
    if (!date || typeof date !== "string" || !isValidISODateOnly(date)) {
      return reply.status(400).send({ error: "date must be YYYY-MM-DD" });
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return reply.status(400).send({ error: "amount must be a number > 0" });
    }
    if (!paymentMethodId || typeof paymentMethodId !== "string") {
      return reply.status(400).send({ error: "paymentMethodId is required" });
    }

    // Asegurar que el Month exista (mensaje claro)
    const month = await prisma.month.findUnique({ where: { id: monthId } });
    if (!month) {
      return reply.status(404).send({ error: "month not found" });
    }

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
      select: { id: true, isActive: true, type: true },
    });
    if (!paymentMethod) {
      return reply.status(404).send({ error: "payment method not found" });
    }
    if (!paymentMethod.isActive) {
      return reply.status(400).send({ error: "payment method is not active" });
    }
    if (paymentMethod.type === "CREDIT") {
      return reply.status(400).send({ error: "payment method must be CASH or DEBIT" });
    }

    const created = await prisma.income.create({
      data: {
        monthId,
        date: new Date(date),
        amount, // Prisma Decimal acepta number
        source: source?.trim() || null,
        note: note?.trim() || null,
        paymentMethodId,
      },
      include: { paymentMethod: true },
    });

    return reply.status(201).send(created);
  });

  // GET /months/:monthId/incomes
  app.get<{ Params: { monthId: string } }>("/months/:monthId/incomes", async (req, reply) => {
    const { monthId } = req.params;

    const month = await prisma.month.findUnique({ where: { id: monthId } });
    if (!month) {
      return reply.status(404).send({ error: "month not found" });
    }

    const incomes = await prisma.income.findMany({
      where: { monthId },
      orderBy: [{ date: "asc" }],
      include: { paymentMethod: true },
    });

    return { month, incomes };
  });

  // PATCH /incomes/:id
  app.patch<{ Params: { id: string }; Body: UpdateIncomeBody }>("/incomes/:id", async (req, reply) => {
    const { id } = req.params;
    const body = req.body ?? ({} as UpdateIncomeBody);

    const existing = await prisma.income.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: "income not found" });

    if (body.date !== undefined) {
      if (typeof body.date !== "string" || !isValidISODateOnly(body.date)) {
        return reply.status(400).send({ error: "date must be YYYY-MM-DD" });
      }
    }

    if (body.amount !== undefined) {
      if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
        return reply.status(400).send({ error: "amount must be a number > 0" });
      }
    }
    if (body.paymentMethodId !== undefined) {
      if (body.paymentMethodId === null || body.paymentMethodId === "") {
        return reply.status(400).send({ error: "paymentMethodId must be a non-empty string" });
      }
      const pm = await prisma.paymentMethod.findUnique({
        where: { id: body.paymentMethodId },
        select: { id: true, isActive: true, type: true },
      });
      if (!pm) return reply.status(404).send({ error: "payment method not found" });
      if (!pm.isActive) return reply.status(400).send({ error: "payment method is not active" });
      if (pm.type === "CREDIT") {
        return reply.status(400).send({ error: "payment method must be CASH or DEBIT" });
      }
    }

    const updated = await prisma.income.update({
      where: { id },
      data: {
        date: body.date === undefined ? undefined : new Date(body.date),
        amount: body.amount === undefined ? undefined : body.amount,
        paymentMethodId: body.paymentMethodId ?? undefined,
      },
      include: { paymentMethod: true },
    });

    return updated;
  });

  // DELETE /incomes/:id
  app.delete<{ Params: { id: string } }>("/incomes/:id", async (req, reply) => {
    const { id } = req.params;

    const existing = await prisma.income.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: "income not found" });

    await prisma.income.delete({ where: { id } });
    return reply.status(204).send();
  });
}
