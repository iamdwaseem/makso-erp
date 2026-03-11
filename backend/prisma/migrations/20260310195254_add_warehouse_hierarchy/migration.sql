-- 1. Create the warehouses table
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- 2. Create a "Main Warehouse" for every existing organization
-- We use a subquery to generate a stable ID or just use gen_random_uuid() if available.
-- To be safe across versions, we can use pgcrypto if it's there, but most modern PG has gen_random_uuid()
INSERT INTO "warehouses" (id, organization_id, name, code, updated_at)
SELECT md5(id::text || 'main')::uuid, id, 'Main Warehouse', 'MAIN', now()
FROM "organizations";

-- 3. Add warehouse_id columns as NULLABLE first
ALTER TABLE "inventory" ADD COLUMN "warehouse_id" UUID;
ALTER TABLE "inventory_ledger" ADD COLUMN "warehouse_id" UUID;
ALTER TABLE "scan_logs" ADD COLUMN "warehouse_id" UUID;

-- 4. Fill the warehouse_id columns based on the organization_id
UPDATE "inventory" i
SET "warehouse_id" = w.id
FROM "warehouses" w
WHERE i."organization_id" = w."organization_id" AND w.code = 'MAIN';

UPDATE "inventory_ledger" il
SET "warehouse_id" = w.id
FROM "warehouses" w
WHERE il."organization_id" = w."organization_id" AND w.code = 'MAIN';

UPDATE "scan_logs" sl
SET "warehouse_id" = w.id
FROM "warehouses" w
WHERE sl."organization_id" = w."organization_id" AND w.code = 'MAIN';

-- 5. Now set them to NOT NULL
ALTER TABLE "inventory" ALTER COLUMN "warehouse_id" SET NOT NULL;
ALTER TABLE "inventory_ledger" ALTER COLUMN "warehouse_id" SET NOT NULL;
ALTER TABLE "scan_logs" ALTER COLUMN "warehouse_id" SET NOT NULL;

-- 6. Add constraints and indexes
DROP INDEX IF EXISTS "inventory_variant_id_key";
CREATE UNIQUE INDEX "inventory_variant_id_warehouse_id_key" ON "inventory"("variant_id", "warehouse_id");
CREATE INDEX "inventory_warehouse_id_idx" ON "inventory"("warehouse_id");
CREATE INDEX "inventory_ledger_warehouse_id_idx" ON "inventory_ledger"("warehouse_id");
CREATE INDEX "scan_logs_warehouse_id_idx" ON "scan_logs"("warehouse_id");
CREATE UNIQUE INDEX "warehouses_organization_id_code_key" ON "warehouses"("organization_id", "code");
CREATE INDEX "warehouses_organization_id_idx" ON "warehouses"("organization_id");

-- 7. Add foreign keys
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
