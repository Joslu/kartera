import type { FastifyInstance } from "fastify";
import { prisma } from "../db";

export async function categoriesRoutes(app: FastifyInstance) {
  // GET /categories
  // Devuelve categorías activas con su grupo, ordenadas para UI
  app.get("/categories", async () => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: { group: true },
      orderBy: [{ group: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
    });

    // Dejarlo simple: devolvemos tal cual
    return categories;
  });
}
