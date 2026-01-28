import type { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { CategoryKind } from "@prisma/client";

type CreateCategoryBody = {
  name: string;
  groupId: string;
  kind: CategoryKind;
  sortOrder?: number;
};

type CreateCategoryGroupBody = {
  name: string;
  sortOrder?: number;
};

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

  // GET /category-groups
  app.get("/category-groups", async () => {
    const groups = await prisma.categoryGroup.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return groups;
  });

  // POST /category-groups
  app.post<{ Body: CreateCategoryGroupBody }>(
    "/category-groups",
    async (req, reply) => {
      const body = req.body ?? ({} as CreateCategoryGroupBody);
      const { name, sortOrder } = body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return reply.status(400).send({ error: "name is required" });
      }
      if (sortOrder !== undefined) {
        if (
          typeof sortOrder !== "number" ||
          !Number.isFinite(sortOrder) ||
          sortOrder < 0
        ) {
          return reply
            .status(400)
            .send({ error: "sortOrder must be a number >= 0" });
        }
      }

      try {
        const created = await prisma.categoryGroup.create({
          data: {
            name: name.trim(),
            sortOrder: sortOrder ?? 0,
          },
        });
        return reply.status(201).send(created);
      } catch (err: any) {
        if (err?.code === "P2002") {
          return reply.status(409).send({ error: "group already exists" });
        }
        throw err;
      }
    },
  );

  // DELETE /category-groups/:id
  app.delete<{ Params: { id: string } }>(
    "/category-groups/:id",
    async (req, reply) => {
      const { id } = req.params;

      const group = await prisma.categoryGroup.findUnique({
        where: { id },
        include: { categories: { select: { id: true } } },
      });
      if (!group) return reply.status(404).send({ error: "group not found" });

      if (group.categories.length > 0) {
        return reply.status(409).send({
          error: "group has related categories",
        });
      }

      await prisma.categoryGroup.delete({ where: { id } });
      return reply.status(204).send();
    },
  );

  // POST /categories
  app.post<{ Body: CreateCategoryBody }>("/categories", async (req, reply) => {
    const body = req.body ?? ({} as CreateCategoryBody);
    const { name, groupId, kind, sortOrder } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return reply.status(400).send({ error: "name is required" });
    }
    if (!groupId || typeof groupId !== "string") {
      return reply.status(400).send({ error: "groupId is required" });
    }
    if (!kind || !Object.values(CategoryKind).includes(kind)) {
      return reply.status(400).send({ error: "kind must be EXPENSE or TRACKING" });
    }
    if (sortOrder !== undefined) {
      if (typeof sortOrder !== "number" || !Number.isFinite(sortOrder) || sortOrder < 0) {
        return reply.status(400).send({ error: "sortOrder must be a number >= 0" });
      }
    }

    const group = await prisma.categoryGroup.findUnique({ where: { id: groupId } });
    if (!group) return reply.status(404).send({ error: "group not found" });

    try {
      const created = await prisma.category.create({
        data: {
          name: name.trim(),
          groupId,
          kind,
          sortOrder: sortOrder ?? 0,
          isActive: true,
        },
        include: { group: true },
      });
      return reply.status(201).send(created);
    } catch (err: any) {
      if (err?.code === "P2002") {
        return reply.status(409).send({ error: "category already exists in group" });
      }
      throw err;
    }
  });

  // DELETE /categories/:id
  app.delete<{ Params: { id: string } }>("/categories/:id", async (req, reply) => {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        assignments: { select: { id: true } },
        transactions: { select: { id: true } },
      },
    });
    if (!category) return reply.status(404).send({ error: "category not found" });

    if (category.name.toLowerCase() === "no identificado") {
      return reply.status(400).send({ error: "cannot delete default category" });
    }

    if (category.assignments.length > 0 || category.transactions.length > 0) {
      return reply.status(409).send({
        error: "category has related assignments or transactions",
      });
    }

    await prisma.category.delete({ where: { id } });
    return reply.status(204).send();
  });
}
