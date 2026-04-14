import type { PrismaClient } from "@prisma/client";

/**
 * Physical Postgres table names (Prisma @@map), child-before-parent order.
 * All seed entrypoints TRUNCATE these — running seed wipes tenant data on purpose.
 */
export const SEED_TRUNCATE_TABLES: readonly string[] = [
  "dashboard_metrics",
  "scan_logs",
  "inventory_ledger",
  "inventory_summaries",
  "inventory",
  "purchase_items",
  "sale_items",
  "purchases",
  "sales",
  "transfer_items",
  "transfers",
  "variants",
  "products",
  "customers",
  "suppliers",
  "user_warehouses",
  "sku_history",
  "update_requests",
  "warehouses",
  "users",
  "categories",
  "organizations",
];

export async function truncateAllApplicationTables(prisma: PrismaClient): Promise<void> {
  console.log("Wiping application tables (TRUNCATE) — all tenant data will be removed.");
  for (const table of SEED_TRUNCATE_TABLES) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`);
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("does not exist")) console.warn(`[seed truncate] ${table}:`, msg);
    }
  }
}

export async function reEnableRlsOnSeedTables(prisma: PrismaClient): Promise<void> {
  for (const table of SEED_TRUNCATE_TABLES) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
    } catch {
      /* table may not exist on older DBs */
    }
  }
}
