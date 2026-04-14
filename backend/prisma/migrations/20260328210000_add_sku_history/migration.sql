-- CreateEnum
CREATE TYPE "SkuHistoryEntityType" AS ENUM ('product', 'variant');

-- CreateEnum
CREATE TYPE "SkuHistoryReason" AS ENUM ('name_change', 'color_change', 'size_change', 'manual_override');

-- CreateTable
CREATE TABLE "sku_history" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "entity_type" "SkuHistoryEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_sku" TEXT NOT NULL,
    "new_sku" TEXT NOT NULL,
    "reason" "SkuHistoryReason" NOT NULL,
    "changed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sku_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sku_history_organization_id_entity_type_entity_id_idx" ON "sku_history"("organization_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "sku_history_old_sku_idx" ON "sku_history"("old_sku");

-- CreateIndex
CREATE INDEX "sku_history_new_sku_idx" ON "sku_history"("new_sku");

-- AddForeignKey
ALTER TABLE "sku_history" ADD CONSTRAINT "sku_history_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sku_history" ADD CONSTRAINT "sku_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sku_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sku_history" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON "sku_history";
CREATE POLICY tenant_isolation ON "sku_history" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);
