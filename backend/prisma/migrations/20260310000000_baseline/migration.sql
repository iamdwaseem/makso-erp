-- WareFlow — Baseline Migration
-- Generated from prisma/schema.prisma (db push → migrate baseline)
-- Applied via: npx prisma migrate resolve --applied 20260310000000_baseline
-- Then use: npx prisma migrate deploy for all future schema changes

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE "LedgerAction" AS ENUM ('IN', 'OUT');

-- Suppliers
CREATE TABLE "suppliers" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "name"       TEXT        NOT NULL,
    "phone"      TEXT        NOT NULL,
    "email"      TEXT,
    "address"    TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- Customers
CREATE TABLE "customers" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "name"       TEXT        NOT NULL,
    "phone"      TEXT        NOT NULL,
    "email"      TEXT,
    "address"    TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- Products (with soft delete)
CREATE TABLE "products" (
    "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
    "name"        TEXT        NOT NULL,
    "sku"         TEXT        NOT NULL,
    "description" TEXT,
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"  TIMESTAMPTZ,
    CONSTRAINT "products_pkey"    PRIMARY KEY ("id"),
    CONSTRAINT "products_sku_key" UNIQUE ("sku")
);

-- Variants (with soft delete)
CREATE TABLE "variants" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID        NOT NULL,
    "color"      TEXT        NOT NULL,
    "sku"        TEXT        NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "variants_pkey"    PRIMARY KEY ("id"),
    CONSTRAINT "variants_sku_key" UNIQUE ("sku"),
    CONSTRAINT "variants_product_id_fkey" FOREIGN KEY ("product_id")
        REFERENCES "products"("id") ON DELETE CASCADE
);

-- Inventory
CREATE TABLE "inventory" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "variant_id" UUID        NOT NULL,
    "quantity"   INTEGER     NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "inventory_pkey"           PRIMARY KEY ("id"),
    CONSTRAINT "inventory_variant_id_key" UNIQUE ("variant_id"),
    CONSTRAINT "inventory_variant_id_fkey" FOREIGN KEY ("variant_id")
        REFERENCES "variants"("id") ON DELETE CASCADE
);

-- Inventory Ledger
CREATE TABLE "inventory_ledger" (
    "id"             UUID          NOT NULL DEFAULT gen_random_uuid(),
    "variant_id"     UUID          NOT NULL,
    "action"         "LedgerAction" NOT NULL,
    "quantity"       INTEGER        NOT NULL,
    "reference_type" TEXT           NOT NULL,
    "reference_id"   UUID           NOT NULL,
    "created_at"     TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_ledger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_ledger_variant_id_fkey" FOREIGN KEY ("variant_id")
        REFERENCES "variants"("id") ON DELETE CASCADE
);
CREATE INDEX "inventory_ledger_variant_id_idx" ON "inventory_ledger"("variant_id");
CREATE INDEX "inventory_ledger_created_at_idx"  ON "inventory_ledger"("created_at");

-- Purchases
CREATE TABLE "purchases" (
    "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
    "supplier_id"    UUID        NOT NULL,
    "invoice_number" TEXT,
    "purchase_date"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id")
        REFERENCES "suppliers"("id") ON DELETE RESTRICT
);
CREATE INDEX "purchases_supplier_id_idx"  ON "purchases"("supplier_id");
CREATE INDEX "purchases_purchase_date_idx" ON "purchases"("purchase_date");

-- Purchase Items
CREATE TABLE "purchase_items" (
    "id"          UUID    NOT NULL DEFAULT gen_random_uuid(),
    "purchase_id" UUID    NOT NULL,
    "variant_id"  UUID    NOT NULL,
    "quantity"    INTEGER NOT NULL,
    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id")
        REFERENCES "purchases"("id") ON DELETE CASCADE,
    CONSTRAINT "purchase_items_variant_id_fkey" FOREIGN KEY ("variant_id")
        REFERENCES "variants"("id") ON DELETE RESTRICT
);
CREATE INDEX "purchase_items_variant_id_idx"  ON "purchase_items"("variant_id");
CREATE INDEX "purchase_items_purchase_id_idx" ON "purchase_items"("purchase_id");

-- Sales
CREATE TABLE "sales" (
    "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
    "customer_id"    UUID        NOT NULL,
    "invoice_number" TEXT,
    "sale_date"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id")
        REFERENCES "customers"("id") ON DELETE RESTRICT
);
CREATE INDEX "sales_customer_id_idx" ON "sales"("customer_id");
CREATE INDEX "sales_sale_date_idx"   ON "sales"("sale_date");

-- Sale Items
CREATE TABLE "sale_items" (
    "id"         UUID    NOT NULL DEFAULT gen_random_uuid(),
    "sale_id"    UUID    NOT NULL,
    "variant_id" UUID    NOT NULL,
    "quantity"   INTEGER NOT NULL,
    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id")
        REFERENCES "sales"("id") ON DELETE CASCADE,
    CONSTRAINT "sale_items_variant_id_fkey" FOREIGN KEY ("variant_id")
        REFERENCES "variants"("id") ON DELETE RESTRICT
);
CREATE INDEX "sale_items_variant_id_idx" ON "sale_items"("variant_id");
CREATE INDEX "sale_items_sale_id_idx"    ON "sale_items"("sale_id");

-- Scan Logs
CREATE TABLE "scan_logs" (
    "id"         UUID          NOT NULL DEFAULT gen_random_uuid(),
    "variant_id" UUID          NOT NULL,
    "action"     "LedgerAction" NOT NULL,
    "quantity"   INTEGER        NOT NULL,
    "station_id" UUID,
    "created_at" TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scan_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "scan_logs_variant_id_fkey" FOREIGN KEY ("variant_id")
        REFERENCES "variants"("id") ON DELETE CASCADE
);
CREATE INDEX "scan_logs_variant_id_idx" ON "scan_logs"("variant_id");
CREATE INDEX "scan_logs_created_at_idx" ON "scan_logs"("created_at");

-- Users
CREATE TABLE "users" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "name"       TEXT        NOT NULL,
    "email"      TEXT        NOT NULL,
    "password"   TEXT        NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey"      PRIMARY KEY ("id"),
    CONSTRAINT "users_email_key" UNIQUE ("email")
);
