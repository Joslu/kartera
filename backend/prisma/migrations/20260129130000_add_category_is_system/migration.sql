-- AddColumn
ALTER TABLE "Category" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Category_isSystem_idx" ON "Category"("isSystem");
