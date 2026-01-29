import { PrismaClient, CategoryKind, PaymentMethodType } from "@prisma/client";

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
    isSystem?: boolean;
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
    { groupName: "Movimientos", name: "No identificado", kind: "EXPENSE", sortOrder: 0, isSystem: true },
    { groupName: "Movimientos", name: "Pago TDC Banamex", kind: "TRACKING", sortOrder: 10 },
    { groupName: "Movimientos", name: "Pago TDC NU", kind: "TRACKING", sortOrder: 20 },
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
        isSystem: (c as any).isSystem ?? false,
      },
      create: {
        groupId,
        name: c.name,
        kind: c.kind,
        sortOrder: c.sortOrder,
        isActive: true,
        isSystem: (c as any).isSystem ?? false,
      },
    });
  }

  // 3) Payment Methods (iniciales)
  const paymentMethods: Array<{
    name: string;
    type: PaymentMethodType;
    sortOrder: number;
  }> = [
    { name: "Efectivo", type: PaymentMethodType.CASH, sortOrder: 10 },
    { name: "Debito BBVA", type: PaymentMethodType.DEBIT, sortOrder: 20 },
    { name: "Debito Banamex", type: PaymentMethodType.DEBIT, sortOrder: 30 },
    { name: "TDC Banamex", type: PaymentMethodType.CREDIT, sortOrder: 40 },
    { name: "TDC NU", type: PaymentMethodType.CREDIT, sortOrder: 50 },
  ];

  const paymentMethodMap = new Map<string, string>();
  for (const pm of paymentMethods) {
    const saved = await prisma.paymentMethod.upsert({
      where: { name: pm.name },
      update: {
        type: pm.type,
        sortOrder: pm.sortOrder,
        isActive: true,
      },
      create: {
        name: pm.name,
        type: pm.type,
        sortOrder: pm.sortOrder,
        isActive: true,
      },
    });
    paymentMethodMap.set(pm.name, saved.id);
  }

  // 4) Credit Cards (defaults)
  const banamexPaymentCategory = await prisma.category.findFirst({
    where: { name: "Pago TDC Banamex" },
    select: { id: true },
  });
  const nuPaymentCategory = await prisma.category.findFirst({
    where: { name: "Pago TDC NU" },
    select: { id: true },
  });

  const banamexPmId = paymentMethodMap.get("TDC Banamex");
  if (banamexPmId) {
    await prisma.creditCard.upsert({
      where: { paymentMethodId: banamexPmId },
      update: {
        cutoffDay: 20,
        dueDay: 9,
        paymentCategoryId: banamexPaymentCategory?.id ?? null,
      },
      create: {
        paymentMethodId: banamexPmId,
        cutoffDay: 20,
        dueDay: 9,
        paymentCategoryId: banamexPaymentCategory?.id ?? null,
      },
    });
  }

  const nuPmId = paymentMethodMap.get("TDC NU");
  if (nuPmId) {
    await prisma.creditCard.upsert({
      where: { paymentMethodId: nuPmId },
      update: {
        cutoffDay: 26,
        dueDay: 3,
        paymentCategoryId: nuPaymentCategory?.id ?? null,
      },
      create: {
        paymentMethodId: nuPmId,
        cutoffDay: 26,
        dueDay: 3,
        paymentCategoryId: nuPaymentCategory?.id ?? null,
      },
    });
  }

  console.log("✅ Seed completado: CategoryGroups, Categories, PaymentMethods y CreditCards.");
}

main()
  .catch((e) => {
    console.error("❌ Seed falló:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
