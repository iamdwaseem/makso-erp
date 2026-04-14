-- Inventory transfers (schema existed without a migration; seed/API expect these tables)

CREATE TABLE "transfers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "source_warehouse_id" UUID NOT NULL,
    "target_warehouse_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transfers_organization_id_idx" ON "transfers"("organization_id");
CREATE INDEX "transfers_source_warehouse_id_idx" ON "transfers"("source_warehouse_id");
CREATE INDEX "transfers_target_warehouse_id_idx" ON "transfers"("target_warehouse_id");
CREATE INDEX "transfers_status_idx" ON "transfers"("status");

ALTER TABLE "transfers" ADD CONSTRAINT "transfers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_source_warehouse_id_fkey" FOREIGN KEY ("source_warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_target_warehouse_id_fkey" FOREIGN KEY ("target_warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "transfer_items" (
    "id" UUID NOT NULL,
    "transfer_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "transfer_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transfer_items_transfer_id_idx" ON "transfer_items"("transfer_id");
CREATE INDEX "transfer_items_variant_id_idx" ON "transfer_items"("variant_id");

ALTER TABLE "transfer_items" ADD CONSTRAINT "transfer_items_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transfer_items" ADD CONSTRAINT "transfer_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transfers" FORCE ROW LEVEL SECURITY;

ALTER TABLE "transfer_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transfer_items" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transfers_warehouse_isolation ON "transfers";
CREATE POLICY transfers_warehouse_isolation ON "transfers" USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND (
        NULLIF(current_setting('app.allowed_warehouse_ids', true), '') IS NULL
        OR source_warehouse_id = ANY(string_to_array(current_setting('app.allowed_warehouse_ids', true), ',')::uuid[])
        OR target_warehouse_id = ANY(string_to_array(current_setting('app.allowed_warehouse_ids', true), ',')::uuid[])
    )
);

DROP POLICY IF EXISTS transfer_items_transfer_access ON "transfer_items";
CREATE POLICY transfer_items_transfer_access ON "transfer_items" USING (
  EXISTS (
    SELECT 1 FROM transfers t
    WHERE t.id = transfer_items.transfer_id
    AND t.organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND (
        NULLIF(current_setting('app.allowed_warehouse_ids', true), '') IS NULL
        OR t.source_warehouse_id = ANY(string_to_array(current_setting('app.allowed_warehouse_ids', true), ',')::uuid[])
        OR t.target_warehouse_id = ANY(string_to_array(current_setting('app.allowed_warehouse_ids', true), ',')::uuid[])
    )
  )
);
