-- Rename old enum to avoid name conflict with new table
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethodEnum";

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CASH', 'DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditCard" (
    "id" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "cutoffDay" INTEGER NOT NULL,
    "dueDay" INTEGER,
    "paymentCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id")
);

-- AddColumn
ALTER TABLE "Transaction" ADD COLUMN "paymentMethodId" TEXT;

-- Seed initial payment methods (mapped from old enum values)
INSERT INTO "PaymentMethod" ("id", "name", "type", "sortOrder")
VALUES
  ('pm_credito_banamex', 'Credito Banamex', 'CREDIT', 10),
  ('pm_credito_nubank', 'Credito Nubank', 'CREDIT', 20),
  ('pm_debito_bbva', 'Debito BBVA', 'DEBIT', 30),
  ('pm_cash', 'Cash', 'CASH', 40);

UPDATE "Transaction" t
SET "paymentMethodId" = CASE t."paymentMethod"
  WHEN 'CREDIT_BANAMEX' THEN 'pm_credito_banamex'
  WHEN 'CREDIT_NUBANK' THEN 'pm_credito_nubank'
  WHEN 'DEBIT_BBVA' THEN 'pm_debito_bbva'
  WHEN 'CASH' THEN 'pm_cash'
  ELSE NULL
END;

-- Enforce not null after backfill
ALTER TABLE "Transaction" ALTER COLUMN "paymentMethodId" SET NOT NULL;

-- Drop old enum column and type
DROP INDEX "Transaction_paymentMethod_idx";
ALTER TABLE "Transaction" DROP COLUMN "paymentMethod";
DROP TYPE "PaymentMethodEnum";

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_name_key" ON "PaymentMethod"("name");
CREATE UNIQUE INDEX "CreditCard_paymentMethodId_key" ON "CreditCard"("paymentMethodId");
CREATE INDEX "CreditCard_paymentCategoryId_idx" ON "CreditCard"("paymentCategoryId");
CREATE INDEX "Transaction_paymentMethodId_idx" ON "Transaction"("paymentMethodId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_paymentCategoryId_fkey" FOREIGN KEY ("paymentCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
