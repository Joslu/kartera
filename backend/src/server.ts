import Fastify from "fastify";
import { categoriesRoutes } from "./routes/categories";
import { monthsRoutes } from "./routes/month";
import { incomesRoutes } from "./routes/incomes";
import { assignmentsRoutes } from "./routes/assignments";
import { transactionsRoutes } from "./routes/transactions";
import { summaryRoutes } from "./routes/summary";
import cors from "@fastify/cors";

async function main() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ ok: true }));
await app.register(cors, {
  origin: ["http://localhost:5173"],
  methods: ["GET", "PATCH", "POST", "DELETE", "OPTIONS"],
});
  

  await app.register(categoriesRoutes);
  await app.register(monthsRoutes);
  await app.register(incomesRoutes);
  await app.register(assignmentsRoutes);
  await app.register(transactionsRoutes);
  await app.register(summaryRoutes);

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? "0.0.0.0";

  await app.listen({ port, host });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
