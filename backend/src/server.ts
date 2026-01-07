import Fastify from "fastify";

async function main() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ ok: true }));

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? "0.0.0.0";

  await app.listen({ port, host });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
