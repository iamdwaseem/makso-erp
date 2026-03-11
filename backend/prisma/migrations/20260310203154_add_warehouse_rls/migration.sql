-- Warehouse-Level Row Level Security
-- This migration enhances isolation by restricting access to specific warehouses 
-- if the 'app.allowed_warehouse_ids' session variable is set.

-- 1. Remove broad tenant policies for warehouse-scoped tables
DROP POLICY IF EXISTS tenant_isolation ON "warehouses";
DROP POLICY IF EXISTS tenant_isolation ON "inventory";
DROP POLICY IF EXISTS tenant_isolation ON "inventory_summaries";
DROP POLICY IF EXISTS tenant_isolation ON "inventory_ledger";
DROP POLICY IF EXISTS tenant_isolation ON "scan_logs";

-- 2. Create refined policies combining Tenant and Warehouse isolation

-- Warehouses Table
CREATE POLICY warehouse_access_isolation ON "warehouses" USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND (
        NULLIF(current_setting('app.allowed_warehouse_ids', true), '') IS NULL 
        OR id = ANY(string_to_array(current_setting('app.allowed_warehouse_ids', true), ',')::uuid[])
    )
);

-- Inventory Table
CREATE POLICY inventory_warehouse_isolation ON "inventory" USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND (
        NULLIF(current_setting('app.allowed_warehouse_ids', true), '') IS NULL 
        OR warehouse_id = ANY(string_to_array(current_setting('app.allowed_warehouse_ids', true), ',')::uuid[])
    )
);

-- Inventory Summaries Table
CREATE POLICY summaries_warehouse_isolation ON "inventory_summaries" USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND (
        NULLIF(current_setting('app.allowed_warehouse_ids', true), '') IS NULL 
        OR warehouse_id = ANY(string_to_array(current_setting('app.allowed_warehouse_ids', true), ',')::uuid[])
    )
);

-- Inventory Ledger Table
CREATE POLICY ledger_warehouse_isolation ON "inventory_ledger" USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND (
        NULLIF(current_setting('app.allowed_warehouse_ids', true), '') IS NULL 
        OR warehouse_id = ANY(string_to_array(current_setting('app.allowed_warehouse_ids', true), ',')::uuid[])
    )
);

-- Scan Logs Table
CREATE POLICY scan_logs_warehouse_isolation ON "scan_logs" USING (
    organization_id = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND (
        NULLIF(current_setting('app.allowed_warehouse_ids', true), '') IS NULL 
        OR warehouse_id = ANY(string_to_array(current_setting('app.allowed_warehouse_ids', true), ',')::uuid[])
    )
);