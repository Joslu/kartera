import type { FastifyInstance } from "fastify";
import { prisma } from "../db";

type CreateIncomeBody = {
  monthId: string;
  date: string;   // "YYYY-MM-DD"
  amount: number; // > 0
  source?: string;
  note?: string;
};

function isValidISODateOnly(s: string) {
  // Minimal: YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function incomesRoutes(app: FastifyInstance) {
  // POST /incomes
  app.post<{ Body: CreateIncomeBody }>("/incomes", async (req, reply) => {
    const body = req.body ?? ({} as CreateIncomeBody);
    const { monthId, date, amount, source, note } = body;

    if (!monthId || typeof monthId !== "string") {
      return reply.status(400).send({ error: "monthId is required" });
    }
    if (!date || typeof date !== "string" || !isValidISODateOnly(date)) {
      return reply.status(400).send({ error: "date must be YYYY-MM-DD" });
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return reply.status(400).send({ error: "amount must be a number > 0" });
    }

    // Asegurar que el Month exista (mensaje claro)
    const month = await prisma.month.findUnique({ where: { id: monthId } });
    if (!month) {
      return reply.status(404).send({ error: "month not found" });
    }

    const created = await prisma.income.create({
      data: {
        monthId,
        date: new Date(date),
        amount, // Prisma Decimal acepta number
        source: source?.trim() || null,
        note: note?.trim() || null,
      },
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
    });

    return { month, incomes };
  });
}
