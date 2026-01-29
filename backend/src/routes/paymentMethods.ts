import type { FastifyInstance } from "fastify";
import { prisma } from "../db";

type CreatePaymentMethodBody = {
  name: string;
  type: "CASH" | "DEBIT" | "CREDIT";
  isActive?: boolean;
  sortOrder?: number;
};

type UpdatePaymentMethodBody = {
  name?: string;
  type?: "CASH" | "DEBIT" | "CREDIT";
  isActive?: boolean;
  sortOrder?: number;
};

type CreateCreditCardBody = {
  paymentMethodId: string;
  cutoffDay: number;
  dueDay?: number | null;
  paymentCategoryId?: string | null;
};

type UpdateCreditCardBody = {
  cutoffDay?: number;
  dueDay?: number | null;
  paymentCategoryId?: string | null;
};

function isValidDay(n: number) {
  return Number.isInteger(n) && n >= 1 && n <= 31;
}

function clampDay(year: number, monthIndex: number, day: number) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, lastDay);
}

function buildCutoffDate(year: number, monthIndex: number, cutoffDay: number) {
  const day = clampDay(year, monthIndex, cutoffDay);
  return new Date(year, monthIndex, day);
}

function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(d: Date, months: number) {
  const next = new Date(d);
  next.setMonth(next.getMonth() + months);
  return next;
}

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getCycleRange(today: Date, cutoffDay: number) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const thisCutoff = buildCutoffDate(year, month, cutoffDay);

  if (today <= thisCutoff) {
    const prevMonth = month - 1;
    const prevYear = prevMonth < 0 ? year - 1 : year;
    const prevMonthIndex = prevMonth < 0 ? 11 : prevMonth;
    const prevCutoff = buildCutoffDate(prevYear, prevMonthIndex, cutoffDay);
    return {
      start: addDays(prevCutoff, 1),
      end: thisCutoff,
    };
  }

  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const nextMonthIndex = nextMonth > 11 ? 0 : nextMonth;
  const nextCutoff = buildCutoffDate(nextYear, nextMonthIndex, cutoffDay);
  return {
    start: addDays(thisCutoff, 1),
    end: nextCutoff,
  };
}

function getCycleRangeForMode(reference: Date, cutoffDay: number, mode?: string) {
  const current = getCycleRange(reference, cutoffDay);
  if (mode === "previous") {
    const prevRef = addDays(current.start, -1);
    return getCycleRange(prevRef, cutoffDay);
  }
  return current;
}

function getPaymentWindowFromCycle(range: { start: Date; end: Date }, daysAfterCutoff?: number | null) {
  if (!daysAfterCutoff) return null;
  const start = addDays(range.end, 1);
  const end = addDays(range.end, daysAfterCutoff);
  return { start, end };
}

function getPaymentRangeFromCycle(
  range: { start: Date; end: Date },
  daysAfterCutoff?: number | null
) {
  const window = getPaymentWindowFromCycle(range, daysAfterCutoff);
  if (!window) return range;
  return window;
}

function decToNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  return Number(v.toString());
}

export async function paymentMethodsRoutes(app: FastifyInstance) {
  // GET /payment-methods
  app.get("/payment-methods", async () => {
    const items = await prisma.paymentMethod.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { creditCard: true },
    });
    return items;
  });

  // GET /payment-methods/balances
  app.get("/payment-methods/balances", async () => {
    const methods = await prisma.paymentMethod.findMany({
      where: { type: { in: ["DEBIT", "CASH"] }, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const items = await Promise.all(
      methods.map(async (pm) => {
        const [incomeAgg, expenseAgg] = await Promise.all([
          prisma.income.aggregate({
            where: { paymentMethodId: pm.id },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: { paymentMethodId: pm.id },
            _sum: { amount: true },
          }),
        ]);
        const income = decToNumber(incomeAgg._sum.amount);
        const expense = decToNumber(expenseAgg._sum.amount);
        return {
          id: pm.id,
          name: pm.name,
          type: pm.type,
          income,
          expense,
          balance: income - expense,
        };
      }),
    );

    return items;
  });

  // POST /payment-methods
  app.post<{ Body: CreatePaymentMethodBody }>(
    "/payment-methods",
    async (req, reply) => {
      const body = req.body ?? ({} as CreatePaymentMethodBody);
      if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
        return reply.status(400).send({ error: "name is required" });
      }
      if (!body.type || !["CASH", "DEBIT", "CREDIT"].includes(body.type)) {
        return reply.status(400).send({ error: "type must be CASH, DEBIT or CREDIT" });
      }
      const created = await prisma.paymentMethod.create({
        data: {
          name: body.name.trim(),
          type: body.type,
          isActive: typeof body.isActive === "boolean" ? body.isActive : true,
          sortOrder: Number.isInteger(body.sortOrder) ? body.sortOrder : 0,
        },
      });
      return reply.status(201).send(created);
    }
  );

  // PATCH /payment-methods/:id
  app.patch<{ Params: { id: string }; Body: UpdatePaymentMethodBody }>(
    "/payment-methods/:id",
    async (req, reply) => {
      const { id } = req.params;
      const body = req.body ?? ({} as UpdatePaymentMethodBody);
      const updated = await prisma.paymentMethod.update({
        where: { id },
        data: {
          name: body.name?.trim(),
          type: body.type,
          isActive: body.isActive,
          sortOrder: body.sortOrder,
        },
      });
      return updated;
    }
  );

  // DELETE /payment-methods/:id
  app.delete<{ Params: { id: string } }>("/payment-methods/:id", async (req, reply) => {
    const { id } = req.params;
    await prisma.paymentMethod.delete({ where: { id } });
    return reply.status(204).send();
  });

  // GET /credit-cards
  app.get("/credit-cards", async () => {
    const cards = await prisma.creditCard.findMany({
      orderBy: [{ createdAt: "asc" }],
      include: {
        paymentMethod: true,
        paymentCategory: { select: { id: true, name: true } },
      },
    });
    return cards;
  });

  // POST /credit-cards
  app.post<{ Body: CreateCreditCardBody }>("/credit-cards", async (req, reply) => {
    const body = req.body ?? ({} as CreateCreditCardBody);
    if (!body.paymentMethodId || typeof body.paymentMethodId !== "string") {
      return reply.status(400).send({ error: "paymentMethodId is required" });
    }
    if (!isValidDay(body.cutoffDay)) {
      return reply.status(400).send({ error: "cutoffDay must be 1..31" });
    }
    if (body.dueDay !== undefined && body.dueDay !== null && !isValidDay(body.dueDay)) {
      return reply.status(400).send({ error: "dueDay must be days after cutoff (1..31)" });
    }
    const pm = await prisma.paymentMethod.findUnique({
      where: { id: body.paymentMethodId },
      select: { id: true, type: true },
    });
    if (!pm) return reply.status(404).send({ error: "payment method not found" });
    if (pm.type !== "CREDIT") {
      return reply.status(400).send({ error: "payment method must be CREDIT" });
    }
    if (body.paymentCategoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: body.paymentCategoryId },
        select: { id: true, kind: true },
      });
      if (!cat) return reply.status(404).send({ error: "payment category not found" });
      if (cat.kind !== "TRACKING") {
        return reply.status(400).send({ error: "payment category must be TRACKING" });
      }
    }

    const created = await prisma.creditCard.create({
      data: {
        paymentMethodId: body.paymentMethodId,
        cutoffDay: body.cutoffDay,
        dueDay: body.dueDay ?? null,
        paymentCategoryId: body.paymentCategoryId ?? null,
      },
      include: {
        paymentMethod: true,
        paymentCategory: { select: { id: true, name: true } },
      },
    });
    return reply.status(201).send(created);
  });

  // PATCH /credit-cards/:id
  app.patch<{ Params: { id: string }; Body: UpdateCreditCardBody }>(
    "/credit-cards/:id",
    async (req, reply) => {
      const { id } = req.params;
      const body = req.body ?? ({} as UpdateCreditCardBody);
      if (body.cutoffDay !== undefined && !isValidDay(body.cutoffDay)) {
        return reply.status(400).send({ error: "cutoffDay must be 1..31" });
      }
      if (body.dueDay !== undefined && body.dueDay !== null && !isValidDay(body.dueDay)) {
        return reply.status(400).send({ error: "dueDay must be days after cutoff (1..31)" });
      }
      if (body.paymentCategoryId !== undefined && body.paymentCategoryId !== null) {
        const cat = await prisma.category.findUnique({
          where: { id: body.paymentCategoryId },
          select: { id: true, kind: true },
        });
        if (!cat) return reply.status(404).send({ error: "payment category not found" });
        if (cat.kind !== "TRACKING") {
          return reply.status(400).send({ error: "payment category must be TRACKING" });
        }
      }
      const updated = await prisma.creditCard.update({
        where: { id },
        data: {
          cutoffDay: body.cutoffDay,
          dueDay: body.dueDay === undefined ? undefined : body.dueDay,
          paymentCategoryId:
            body.paymentCategoryId === undefined ? undefined : body.paymentCategoryId,
        },
        include: {
          paymentMethod: true,
          paymentCategory: { select: { id: true, name: true } },
        },
      });
      return updated;
    }
  );

  // DELETE /credit-cards/:id
  app.delete<{ Params: { id: string } }>("/credit-cards/:id", async (req, reply) => {
    const { id } = req.params;
    await prisma.creditCard.delete({ where: { id } });
    return reply.status(204).send();
  });

  // GET /credit-cards/summary
  app.get<{ Querystring: { cycle?: string } }>("/credit-cards/summary", async (req) => {
    const today = new Date();
    const cycleMode = req.query?.cycle;
    const cards = await prisma.creditCard.findMany({
      include: {
        paymentMethod: true,
        paymentCategory: { select: { id: true, name: true } },
      },
      orderBy: [{ createdAt: "asc" }],
    });

    const items = await Promise.all(
      cards.map(async (card) => {
        const range = getCycleRangeForMode(today, card.cutoffDay, cycleMode);
        const window = getPaymentWindowFromCycle(range, card.dueDay);
        const paymentRange = getPaymentRangeFromCycle(range, card.dueDay);
        const [spentAgg, paymentAgg] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              paymentMethodId: card.paymentMethodId,
              date: { gte: range.start, lte: range.end },
            },
            _sum: { amount: true },
          }),
          card.paymentCategoryId
            ? prisma.transaction.aggregate({
                where: {
                  categoryId: card.paymentCategoryId,
                  date: { gte: paymentRange.start, lte: paymentRange.end },
                },
                _sum: { amount: true },
              })
            : Promise.resolve({ _sum: { amount: null } }),
        ]);

        const spent = decToNumber(spentAgg._sum.amount);
        const paid = decToNumber(paymentAgg._sum.amount);
        const debt = Math.max(0, spent - paid);

        const todayDate = toDateOnly(today);
        const windowStart = window ? toDateOnly(window.start) : null;
        const windowEnd = window ? toDateOnly(window.end) : null;

        return {
          id: card.id,
          paymentMethodId: card.paymentMethodId,
          paymentMethodName: card.paymentMethod.name,
          cutoffDay: card.cutoffDay,
          dueDay: card.dueDay,
          paymentCategoryId: card.paymentCategoryId,
          paymentCategoryName: card.paymentCategory?.name ?? null,
          cycleStart: toISODate(range.start),
          cycleEnd: toISODate(range.end),
          paymentWindowStart: window ? toISODate(window.start) : null,
          paymentWindowEnd: window ? toISODate(window.end) : null,
          isInPaymentWindow:
            windowStart && windowEnd
              ? todayDate >= windowStart && todayDate <= windowEnd
              : false,
          spent,
          paid,
          debt,
        };
      })
    );

    return items;
  });

  // GET /credit-cards/:id/cycle
  app.get<{ Params: { id: string }; Querystring: { cycle?: string } }>(
    "/credit-cards/:id/cycle",
    async (req, reply) => {
    const { id } = req.params;
    const cycleMode = req.query?.cycle;
    const card = await prisma.creditCard.findUnique({
      where: { id },
      include: {
        paymentMethod: true,
        paymentCategory: { select: { id: true, name: true } },
      },
    });
    if (!card) return reply.status(404).send({ error: "credit card not found" });

    const today = new Date();
    const range = getCycleRangeForMode(today, card.cutoffDay, cycleMode);
    const window = getPaymentWindowFromCycle(range, card.dueDay);
    const paymentRange = getPaymentRangeFromCycle(range, card.dueDay);
    const todayDate = toDateOnly(today);
    const windowStart = window ? toDateOnly(window.start) : null;
    const windowEnd = window ? toDateOnly(window.end) : null;

    const [spent, payments] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          paymentMethodId: card.paymentMethodId,
          date: { gte: range.start, lte: range.end },
        },
        include: { category: { select: { id: true, name: true } } },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      }),
      card.paymentCategoryId
        ? prisma.transaction.findMany({
            where: {
              categoryId: card.paymentCategoryId,
              date: { gte: paymentRange.start, lte: paymentRange.end },
            },
            include: { category: { select: { id: true, name: true } } },
            orderBy: [{ date: "asc" }, { createdAt: "asc" }],
          })
        : Promise.resolve([]),
    ]);

    const items = [
      ...spent.map((t) => ({
        id: t.id,
        date: toISODate(t.date instanceof Date ? t.date : new Date(t.date)),
        amount: decToNumber(t.amount),
        description: t.description,
        kind: "SPENT",
        categoryName: t.category?.name ?? null,
      })),
      ...payments.map((t) => ({
        id: t.id,
        date: toISODate(t.date instanceof Date ? t.date : new Date(t.date)),
        amount: decToNumber(t.amount),
        description: t.description,
        kind: "PAYMENT",
        categoryName: t.category?.name ?? null,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    return {
      card: {
        id: card.id,
        paymentMethodId: card.paymentMethodId,
        paymentMethodName: card.paymentMethod.name,
        cutoffDay: card.cutoffDay,
        dueDay: card.dueDay,
        paymentCategoryName: card.paymentCategory?.name ?? null,
        paymentWindowStart: window ? toISODate(window.start) : null,
        paymentWindowEnd: window ? toISODate(window.end) : null,
        isInPaymentWindow:
          windowStart && windowEnd
            ? todayDate >= windowStart && todayDate <= windowEnd
            : false,
      },
      cycleStart: toISODate(range.start),
      cycleEnd: toISODate(range.end),
      items,
    };
  });
}
