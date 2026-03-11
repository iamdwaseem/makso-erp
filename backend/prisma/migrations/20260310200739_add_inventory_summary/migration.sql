-- AlterTable
ALTER TABLE "warehouses" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "inventory_summaries" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "total_quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved_quantity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_summaries_organization_id_idx" ON "inventory_summaries"("organization_id");

-- CreateIndex
CREATE INDEX "inventory_summaries_warehouse_id_idx" ON "inventory_summaries"("warehouse_id");

-- CreateIndex
CREATE INDEX "inventory_summaries_variant_id_idx" ON "inventory_summaries"("variant_id");

-- CreateIndex
CREATE INDEX "inventory_summaries_organization_id_warehouse_id_idx" ON "inventory_summaries"("organization_id", "warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_summaries_organization_id_warehouse_id_variant_id_key" ON "inventory_summaries"("organization_id", "warehouse_id", "variant_id");

-- AddForeignKey
ALTER TABLE "inventory_summaries" ADD CONSTRAINT "inventory_summaries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_summaries" ADD CONSTRAINT "inventory_summaries_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_summaries" ADD CONSTRAINT "inventory_summaries_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
