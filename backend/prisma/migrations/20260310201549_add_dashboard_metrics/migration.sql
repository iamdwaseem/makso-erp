-- CreateTable
CREATE TABLE "dashboard_metrics" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "warehouse_id" UUID,
    "total_products" INTEGER NOT NULL DEFAULT 0,
    "total_variants" INTEGER NOT NULL DEFAULT 0,
    "total_stock" INTEGER NOT NULL DEFAULT 0,
    "total_sales_today" INTEGER NOT NULL DEFAULT 0,
    "total_purchases_today" INTEGER NOT NULL DEFAULT 0,
    "low_stock_items" INTEGER NOT NULL DEFAULT 0,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dashboard_metrics_organization_id_idx" ON "dashboard_metrics"("organization_id");

-- CreateIndex
CREATE INDEX "dashboard_metrics_warehouse_id_idx" ON "dashboard_metrics"("warehouse_id");

-- AddForeignKey
ALTER TABLE "dashboard_metrics" ADD CONSTRAINT "dashboard_metrics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_metrics" ADD CONSTRAINT "dashboard_metrics_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
