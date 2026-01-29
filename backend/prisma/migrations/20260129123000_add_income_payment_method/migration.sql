-- AddColumn
ALTER TABLE "Income" ADD COLUMN "paymentMethodId" TEXT;

-- CreateIndex
CREATE INDEX "Income_paymentMethodId_idx" ON "Income"("paymentMethodId");

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
