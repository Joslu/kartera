-- AddColumn
ALTER TABLE "Income" ADD COLUMN "isTransfer" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Income_isTransfer_idx" ON "Income"("isTransfer");
