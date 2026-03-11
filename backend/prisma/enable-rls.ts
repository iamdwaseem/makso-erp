import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const tables = [
  "warehouses", "suppliers", "customers", "products", "variants", 
  "inventory", "inventory_summaries", "inventory_ledger", "purchases", 
  "purchase_items", "sales", "sale_items", "scan_logs", "dashboard_metrics"
];

async function main() {
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`);
  }
}

main().finally(() => prisma.$disconnect());
