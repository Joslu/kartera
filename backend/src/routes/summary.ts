import type { FastifyInstance } from "fastify";
import { prisma } from "../db";

function decToNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  // Prisma Decimal (decimal.js) -> string -> number
  return Number(v.toString());
}

export async function summaryRoutes(app: FastifyInstance) {
  // GET /months/:monthId/summary
  app.get<{ Params: { monthId: string } }>("/months/:monthId/summary", async (req, reply) => {
    const { monthId } = req.params;

    const month = await prisma.month.findUnique({ where: { id: monthId } });
    if (!month) return reply.status(404).send({ error: "month not found" });

    // 1) Totales de income
    const incomeAgg = await prisma.income.aggregate({
      where: { monthId },
      _sum: { amount: true },
    });
    const totalIncome = decToNumber(incomeAgg._sum.amount);

    // 2) Asignaciones (con categoría y grupo)
    const assignments = await prisma.budgetAssignment.findMany({
      where: { monthId },
      include: { category: { include: { group: true } } },
      orderBy: [
        { category: { group: { sortOrder: "asc" } } },
        { category: { sortOrder: "asc" } },
        { category: { name: "asc" } },
      ],
    });

    // 3) Transacciones (con categoría y grupo)
    const transactions = await prisma.transaction.findMany({
      where: { monthId },
      include: { category: { include: { group: true } } },
      orderBy: [{ date: "asc" }],
    });

    // Map por categoryId
    const byCategory = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        groupName: string;
        kind: "EXPENSE" | "TRACKING";
        assigned: number;
        spent: number; // suma de transacciones
        available: number;
      }
    >();

    // A) iniciar con asignaciones
    let totalAssigned = 0;
    for (const a of assignments) {
      const assigned = decToNumber(a.amount);
      totalAssigned += assigned;

      byCategory.set(a.categoryId, {
        categoryId: a.categoryId,
        categoryName: a.category.name,
        groupName: a.category.group.name,
        kind: a.category.kind,
        assigned,
        spent: 0,
        available: assigned, // se ajusta con tx
      });
    }

    // B) acumular transacciones
    let totalSpentExpense = 0;
    let totalSpentTracking = 0;

    for (const t of transactions) {
      const spent = decToNumber(t.amount);
      const cat = t.category;

      const existing =
        byCategory.get(t.categoryId) ??
        (() => {
          // categorías con tx aunque no tengan asignación
          const row = {
            categoryId: t.categoryId,
            categoryName: cat.name,
            groupName: cat.group.name,
            kind: cat.kind,
            assigned: 0,
            spent: 0,
            available: 0,
          };
          byCategory.set(t.categoryId, row);
          return row;
        })();

      existing.spent += spent;

      // Totales separados por kind
      if (cat.kind === "EXPENSE") totalSpentExpense += spent;
      else totalSpentTracking += spent;
    }

    // C) calcular available por categoría (assigned - spent) SOLO para EXPENSE
    // Para TRACKING, available no tiene sentido como presupuesto (lo dejamos igual a assigned - spent, pero assigned suele ser 0).
    for (const row of byCategory.values()) {
      row.available = row.assigned - row.spent;
    }

    // D) salida ordenada para UI (grupo->sortOrder y categoría->sortOrder)
    // Para no pedir más queries, construimos un índice de orden usando lo que ya viene
    const groupOrder = new Map<string, number>();
    const catOrder = new Map<string, number>();

    for (const a of assignments) {
      groupOrder.set(a.category.group.name, a.category.group.sortOrder);
      catOrder.set(a.categoryId, a.category.sortOrder);
    }
    for (const t of transactions) {
      groupOrder.set(t.category.group.name, t.category.group.sortOrder);
      catOrder.set(t.categoryId, t.category.sortOrder);
    }

    const categories = Array.from(byCategory.values()).sort((x, y) => {
      const gx = groupOrder.get(x.groupName) ?? 9999;
      const gy = groupOrder.get(y.groupName) ?? 9999;
      if (gx !== gy) return gx - gy;

      const cx = catOrder.get(x.categoryId) ?? 9999;
      const cy = catOrder.get(y.categoryId) ?? 9999;
      if (cx !== cy) return cx - cy;

      return x.categoryName.localeCompare(y.categoryName);
    });

    return {
      month,
      totals: {
        income: totalIncome,
        assigned: totalAssigned,
        spentExpense: totalSpentExpense,
        spentTracking: totalSpentTracking,
      },
      categories,
    };
  });
}
