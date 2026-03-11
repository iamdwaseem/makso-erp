-- Enable RLS on all tenant-scoped tables
ALTER TABLE "warehouses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "warehouses" FORCE ROW LEVEL SECURITY;

ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suppliers" FORCE ROW LEVEL SECURITY;

ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" FORCE ROW LEVEL SECURITY;

ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" FORCE ROW LEVEL SECURITY;

ALTER TABLE "variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "variants" FORCE ROW LEVEL SECURITY;

ALTER TABLE "inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory" FORCE ROW LEVEL SECURITY;

ALTER TABLE "inventory_summaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_summaries" FORCE ROW LEVEL SECURITY;

ALTER TABLE "inventory_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_ledger" FORCE ROW LEVEL SECURITY;

ALTER TABLE "purchases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchases" FORCE ROW LEVEL SECURITY;

ALTER TABLE "purchase_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_items" FORCE ROW LEVEL SECURITY;

ALTER TABLE "sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales" FORCE ROW LEVEL SECURITY;

ALTER TABLE "sale_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sale_items" FORCE ROW LEVEL SECURITY;

ALTER TABLE "scan_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scan_logs" FORCE ROW LEVEL SECURITY;

ALTER TABLE "dashboard_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dashboard_metrics" FORCE ROW LEVEL SECURITY;

-- Create Isolation Policies (using current_setting with true to avoid errors if unset)
DROP POLICY IF EXISTS tenant_isolation ON "warehouses";
CREATE POLICY tenant_isolation ON "warehouses" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON "suppliers";
CREATE POLICY tenant_isolation ON "suppliers" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON "customers";
CREATE POLICY tenant_isolation ON "customers" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON "products";
CREATE POLICY tenant_isolation ON "products" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON "variants";
CREATE POLICY tenant_isolation ON "variants" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON "inventory";
CREATE POLICY tenant_isolation ON "inventory" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON "inventory_summaries";
CREATE POLICY tenant_isolation ON "inventory_summaries" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON "inventory_ledger";
CREATE POLICY tenant_isolation ON "inventory_ledger" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON "purchases";
CREATE POLICY tenant_isolation ON "purchases" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON "purchase_items";
CREATE POLICY tenant_isolation ON "purchase_items" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON "sales";
CREATE POLICY tenant_isolation ON "sales" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON "sale_items";
CREATE POLICY tenant_isolation ON "sale_items" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON "scan_logs";
CREATE POLICY tenant_isolation ON "scan_logs" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON "dashboard_metrics";
CREATE POLICY tenant_isolation ON "dashboard_metrics" USING (organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid);