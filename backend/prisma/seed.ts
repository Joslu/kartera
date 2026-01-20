import { PrismaClient, CategoryKind } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed idempotente:
 * - Usa upsert para no duplicar.
 * - Crea CategoryGroups (alto nivel) y Categories iniciales.
 */
async function main() {
  // 1) Category Groups (alto nivel)
  const groups = [
    { name: "Hogar", sortOrder: 10 },
    { name: "Esenciales", sortOrder: 20 },
    { name: "Transporte", sortOrder: 30 },
    { name: "Estilo de vida", sortOrder: 40 },
    { name: "Estabilidad/Metas", sortOrder: 50 },
    { name: "Movimientos", sortOrder: 60 },
  ] as const;

  const groupMap = new Map<string, string>();

  for (const g of groups) {
    const saved = await prisma.categoryGroup.upsert({
      where: { name: g.name },
      update: { sortOrder: g.sortOrder },
      create: { name: g.name, sortOrder: g.sortOrder },
    });
    groupMap.set(g.name, saved.id);
  }

  const gid = (name: (typeof groups)[number]["name"]) => {
    const id = groupMap.get(name);
    if (!id) throw new Error(`Missing group id for: ${name}`);
    return id;
  };

  // 2) Categories (iniciales)
  // Nota: "No identificado" = EXPENSE (decisión tomada)
  const categories: Array<{
    groupName: (typeof groups)[number]["name"];
    name: string;
    kind: CategoryKind;
    sortOrder: number;
  }> = [
    // Hogar
    { groupName: "Hogar", name: "Renta/Hipoteca", kind: "EXPENSE", sortOrder: 10 },
    { groupName: "Hogar", name: "Servicios (luz/agua/gas)", kind: "EXPENSE", sortOrder: 20 },
    { groupName: "Hogar", name: "Internet/Telefonía", kind: "EXPENSE", sortOrder: 30 },

    // Esenciales
    { groupName: "Esenciales", name: "Super/Despensa", kind: "EXPENSE", sortOrder: 10 },
    { groupName: "Esenciales", name: "Salud", kind: "EXPENSE", sortOrder: 20 },

    // Transporte
    { groupName: "Transporte", name: "Gasolina", kind: "EXPENSE", sortOrder: 10 },
    { groupName: "Transporte", name: "Uber/Taxi", kind: "EXPENSE", sortOrder: 20 },

    // Estilo de vida
    { groupName: "Estilo de vida", name: "Comidas fuera", kind: "EXPENSE", sortOrder: 10 },
    { groupName: "Estilo de vida", name: "Suscripciones", kind: "EXPENSE", sortOrder: 20 },
    { groupName: "Estilo de vida", name: "Compras", kind: "EXPENSE", sortOrder: 30 },

    // Estabilidad/Metas
    { groupName: "Estabilidad/Metas", name: "Ahorro/Inversión", kind: "EXPENSE", sortOrder: 10 },
    { groupName: "Estabilidad/Metas", name: "Fondo de emergencia", kind: "EXPENSE", sortOrder: 20 },

    // Movimientos (TRACKING)
    { groupName: "Movimientos", name: "No identificado", kind: "EXPENSE", sortOrder: 0 },
    { groupName: "Movimientos", name: "Pago TDC Banamex", kind: "TRACKING", sortOrder: 10 },
    { groupName: "Movimientos", name: "Pago TDC Nubank", kind: "TRACKING", sortOrder: 20 },
    { groupName: "Movimientos", name: "Retiro efectivo (Débito BBVA)", kind: "TRACKING", sortOrder: 30 },
    { groupName: "Movimientos", name: "Transferencias", kind: "TRACKING", sortOrder: 40 },
  ];

  for (const c of categories) {
    const groupId = gid(c.groupName);

    await prisma.category.upsert({
      // @@unique([groupId, name]) en schema, así que la llave es compuesta
      where: { groupId_name: { groupId, name: c.name } },
      update: {
        kind: c.kind,
        sortOrder: c.sortOrder,
        isActive: true,
      },
      create: {
        groupId,
        name: c.name,
        kind: c.kind,
        sortOrder: c.sortOrder,
        isActive: true,
      },
    });
  }

  console.log("✅ Seed completado: CategoryGroups y Categories iniciales.");
}

main()
  .catch((e) => {
    console.error("❌ Seed falló:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
