import type { FastifyInstance } from "fastify";
import { prisma } from "../db";

type CreateMonthBody = {
  year: number;
  month: number; // 1-12
};

export async function monthsRoutes(app: FastifyInstance) {
  // GET /months
  // Lista meses existentes (más recientes primero)
  app.get("/months", async () => {
    const months = await prisma.month.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return months;
  });

  // POST /months
  // Crea un mes por (year, month)
  app.post<{ Body: CreateMonthBody }>("/months", async (req, reply) => {
    const { year, month } = req.body ?? ({} as CreateMonthBody);

    // Validación mínima (sin librerías extra por ahora)
    const isInt = (n: unknown) => Number.isInteger(n);
    if (!isInt(year) || !isInt(month) || month < 1 || month > 12) {
      return reply.status(400).send({
        error: "Invalid payload",
        message: "Body must be { year: int, month: int (1-12) }",
      });
    }

    try {
      const created = await prisma.month.create({
        data: { year, month },
      });
      return reply.status(201).send(created);
    } catch (err: any) {
      // Prisma unique constraint violation
      // @@unique([year, month]) => error code P2002
      if (err?.code === "P2002") {
        return reply.status(409).send({
          error: "Month already exists",
          message: `Month ${year}-${String(month).padStart(2, "0")} already exists`,
        });
      }
      req.log.error(err);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });
}
