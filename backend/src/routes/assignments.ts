import type { FastifyInstance } from "fastify";
import { prisma } from "../db";

type CreateAssignmentBody = {
  monthId: string;
  categoryId: string;
  amount: number; // >= 0
};

export async function assignmentsRoutes(app: FastifyInstance) {
  // POST /budget-assignments
  // Upsert: una asignación por (monthId, categoryId)
  app.post<{ Body: CreateAssignmentBody }>("/budget-assignments", async (req, reply) => {
    const body = req.body ?? ({} as CreateAssignmentBody);
    const { monthId, categoryId, amount } = body;

    if (!monthId || typeof monthId !== "string") {
      return reply.status(400).send({ error: "monthId is required" });
    }
    if (!categoryId || typeof categoryId !== "string") {
      return reply.status(400).send({ error: "categoryId is required" });
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
      return reply.status(400).send({ error: "amount must be a number >= 0" });
    }

    const [month, category] = await Promise.all([
      prisma.month.findUnique({ where: { id: monthId } }),
      prisma.category.findUnique({ where: { id: categoryId } }),
    ]);

    if (!month) return reply.status(404).send({ error: "month not found" });
    if (!category) return reply.status(404).send({ error: "category not found" });
    if (!category.isActive) return reply.status(400).send({ error: "category is not active" });

    const saved = await prisma.budgetAssignment.upsert({
      where: { monthId_categoryId: { monthId, categoryId } },
      update: { amount },
      create: { monthId, categoryId, amount },
    });

    return reply.status(201).send(saved);
  });

  // GET /months/:monthId/assignments
  app.get<{ Params: { monthId: string } }>("/months/:monthId/assignments", async (req, reply) => {
    const { monthId } = req.params;

    const month = await prisma.month.findUnique({ where: { id: monthId } });
    if (!month) return reply.status(404).send({ error: "month not found" });

    const assignments = await prisma.budgetAssignment.findMany({
      where: { monthId },
      include: { category: { include: { group: true } } },
      orderBy: [{ category: { group: { sortOrder: "asc" } } }, { category: { sortOrder: "asc" } }, { category: { name: "asc" } }],
    });

    return { month, assignments };
  });
}
