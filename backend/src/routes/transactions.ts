import type { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { PaymentMethod } from "@prisma/client";

type CreateTransactionBody = {
  monthId: string;
  date: string; // YYYY-MM-DD
  amount: number; // > 0
  description: string;
  paymentMethod: PaymentMethod;
  categoryId?: string; // opcional => default "No identificado"
  note?: string;
  isReconciled?: boolean;
};

type UpdateTransactionBody = {
  categoryId?: string;
  note?: string | null;
  isReconciled?: boolean;
  description?: string;
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
    const { monthId, date, amount, description, paymentMethod, categoryId, note, isReconciled } = body;

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
    if (!paymentMethod || typeof paymentMethod !== "string") {
      return reply.status(400).send({ error: "paymentMethod is required" });
    }

    const month = await prisma.month.findUnique({ where: { id: monthId } });
    if (!month) return reply.status(404).send({ error: "month not found" });

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
        paymentMethod,
        categoryId: finalCategoryId,
        note: note?.trim() || null,
        isReconciled: typeof isReconciled === "boolean" ? isReconciled : false,
      },
      include: { category: { include: { group: true } } },
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
      include: { category: { include: { group: true } } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    return { month, transactions };
  });

  async function getUnidentifiedCategoryId() {
  const cat = await prisma.category.findFirst({
    where: { name: "No identificado", isActive: true },
    select: { id: true },
  });
  if (!cat) throw new Error('Missing seed category: "No identificado"');
  return cat.id;
}

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
      include: { category: { include: { group: true } } },
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

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        categoryId: body.categoryId,
        isReconciled: typeof body.isReconciled === "boolean" ? body.isReconciled : undefined,
        note: body.note === undefined ? undefined : body.note?.trim() ?? null,
        description:
          body.description === undefined ? undefined : body.description.trim(),
      },
      include: { category: { include: { group: true } } },
    });

    return updated;
  }
);



}
