/**
 * Seed database from makso-products.csv.
 * Run from project root: npx tsx backend/prisma/seed-makso.ts
 * Or from backend: npx tsx prisma/seed-makso.ts
 *
 * Creates: org, warehouses, users, categories, products, variants,
 * suppliers, customers, purchases (spread over past months), sales,
 * inventory, inventory_summaries, inventory_ledger. Uses varied dates
 * so dashboard trend and gain/loss graphs have data. Some variants
 * are given low stock so "Products to Reorder" table shows rows.
 */
import {
  PrismaClient,
  LedgerAction,
  UserRole,
  PurchaseStatus,
  SaleStatus,
  PaymentType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const BATCH = 50;

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i++;
      let field = "";
      while (i < line.length && line[i] !== '"') {
        field += line[i];
        i++;
      }
      if (line[i] === '"') i++;
      out.push(field.trim());
      if (line[i] === ",") i++;
    } else {
      const comma = line.indexOf(",", i);
      const end = comma === -1 ? line.length : comma;
      out.push(line.slice(i, end).trim());
      i = comma === -1 ? line.length : comma + 1;
    }
  }
  return out;
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "item";
}

function uniqueSku(sku: string, used: Set<string>): string {
  let s = sku;
  let n = 0;
  while (used.has(s)) {
    n++;
    s = `${sku}-${n}`;
  }
  used.add(s);
  return s;
}

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function findCsvPath(): string {
  const candidates = [
    path.resolve(__dirname, "../../makso-products.csv"),
    path.resolve(process.cwd(), "makso-products.csv"),
    path.resolve(process.cwd(), "../makso-products.csv"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `makso-products.csv not found. Tried:\n${candidates.map((p) => `  - ${p}`).join("\n")}\nPlace makso-products.csv at the repo root or run from backend/ with CSV in backend/ or repo root.`
  );
}

async function main() {
  const csvPath = findCsvPath();
  console.log(`Using CSV: ${csvPath}`);
  const csvText = fs.readFileSync(csvPath, "utf-8");
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].toLowerCase();
  const dataRows = lines.slice(1);
  const rows: { product_name: string; category: string; description: string; source_url: string }[] = [];
  for (const line of dataRows) {
    const parts = parseCsvLine(line);
    if (parts.length >= 2) {
      rows.push({
        product_name: (parts[0] ?? "").trim(),
        category: (parts[1] ?? "").trim(),
        description: (parts[2] ?? "").trim(),
        source_url: (parts[3] ?? "").trim(),
      });
    }
  }
  const categories = [...new Set(rows.map((r) => r.category).filter(Boolean))];
  console.log(`Parsed ${rows.length} products, ${categories.length} categories.`);

  const tables = [
    "dashboard_metrics", "scan_logs", "inventory_ledger", "inventory_summaries",
    "inventory", "purchase_items", "sale_items", "purchases", "sales",
    "variants", "products", "customers", "suppliers", "user_warehouses",
    "warehouses", "users", "categories", "organizations",
  ];
  console.log("Resetting database...");
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`);
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (e: any) {
      if (!e.message?.includes("does not exist")) console.warn(table, e.message);
    }
  }

  console.log("Creating organization and warehouses...");
  const org = await prisma.organization.create({
    data: { name: "MAKSO Trading", slug: "makso" },
  });
  const warehouses = await Promise.all([
    prisma.warehouse.create({ data: { organization_id: org.id, name: "Dubai Warehouse", code: "DXB-01", location: "Dubai" } }),
    prisma.warehouse.create({ data: { organization_id: org.id, name: "Abu Dhabi Store", code: "AUH-02", location: "Abu Dhabi" } }),
  ]);

  console.log("Creating users...");
  const adminHash = await bcrypt.hash("admin1234", 12);
  const managerHash = await bcrypt.hash("manager1234", 12);
  const staffHash = await bcrypt.hash("staff1234", 12);
  const usersData = [
    { id: crypto.randomUUID(), name: "Admin", email: "admin@makso.com", password: adminHash, role: UserRole.ADMIN, organization_id: org.id },
    { id: crypto.randomUUID(), name: "Manager", email: "manager@makso.com", password: managerHash, role: UserRole.MANAGER, organization_id: org.id },
    { id: crypto.randomUUID(), name: "Staff", email: "staff@makso.com", password: staffHash, role: UserRole.STAFF, organization_id: org.id },
  ];
  await prisma.user.createMany({ data: usersData });
  const staffUser = usersData[2];
  await (prisma as any).userWarehouse.createMany({
    data: warehouses.map((w) => ({ user_id: staffUser.id, warehouse_id: w.id })),
  });

  console.log("Creating categories and products from CSV...");
  const categoryIds = new Map<string, string>();
  for (const name of categories) {
    const c = await prisma.category.create({
      data: { id: crypto.randomUUID(), organization_id: org.id, name },
    });
    categoryIds.set(name, c.id);
  }

  const productSkus = new Set<string>();
  const productsData = rows.map((r) => {
    const baseSku = slug(r.product_name).replace(/-/g, "").toUpperCase().slice(0, 12) || "PRD";
    const sku = uniqueSku(baseSku, productSkus);
    return {
      id: crypto.randomUUID(),
      organization_id: org.id,
      category_id: r.category ? categoryIds.get(r.category) ?? null : null,
      name: r.product_name,
      sku,
      description: r.description || null,
    };
  });
  for (const batch of chunks(productsData, BATCH)) {
    await prisma.product.createMany({ data: batch });
  }

  const productBySku = new Map<string, (typeof productsData)[0]>();
  productsData.forEach((p) => productBySku.set(p.sku, p));

  const variantsData = productsData.map((p) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    product_id: p.id,
    color: "Default",
    sku: p.sku,
  }));
  for (const batch of chunks(variantsData, BATCH)) {
    await prisma.variant.createMany({ data: batch });
  }

  console.log("Creating suppliers and customers...");
  const suppliersData = Array.from({ length: 20 }).map((_, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    name: `Supplier ${i + 1}`,
    phone: `+97150${String(1000000 + i).slice(-7)}`,
    email: `sup${i + 1}@example.com`,
    address: null as string | null,
  }));
  await prisma.supplier.createMany({ data: suppliersData });

  const customersData = Array.from({ length: 15 }).map((_, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    name: `Customer ${i + 1}`,
    phone: `+9714${String(2000000 + i).slice(-7)}`,
    email: null as string | null,
    address: null as string | null,
  }));
  await prisma.customer.createMany({ data: customersData });

  // Purchases and ledger entries spread over the past 4 months so trend/gain-loss graphs have data
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const purchasesData: {
    id: string;
    organization_id: string;
    supplier_id: string;
    warehouse_id: string;
    invoice_number: string;
    purchase_date: Date;
    created_at: Date;
    updated_at: Date;
    status: PurchaseStatus;
  }[] = [];
  const purchaseItemsData: { id: string; organization_id: string; purchase_id: string; variant_id: string; quantity: number }[] = [];
  const ledgerInData: { id: string; organization_id: string; variant_id: string; warehouse_id: string; action: LedgerAction; quantity: number; reference_type: string; reference_id: string; created_at: Date }[] = [];

  for (let i = 0; i < 80; i++) {
    const daysAgo = Math.floor(i * 1.2); // spread over ~96 days
    const created = new Date(now - daysAgo * oneDay);
    const purchaseId = crypto.randomUUID();
    const supplierId = suppliersData[i % suppliersData.length].id;
    const warehouseId = warehouses[i % warehouses.length].id;
    purchasesData.push({
      id: purchaseId,
      organization_id: org.id,
      supplier_id: supplierId,
      warehouse_id: warehouseId,
      invoice_number: `PUR-${String(i + 1).padStart(5, "0")}`,
      purchase_date: created,
      created_at: created,
      updated_at: created,
      status: PurchaseStatus.SUBMITTED,
    });
    const numItems = 1 + (i % 5);
    for (let j = 0; j < numItems; j++) {
      const v = variantsData[(i + j) % variantsData.length];
      const qty = 5 + (i % 20);
      purchaseItemsData.push({
        id: crypto.randomUUID(),
        organization_id: org.id,
        purchase_id: purchaseId,
        variant_id: v.id,
        quantity: qty,
      });
      ledgerInData.push({
        id: crypto.randomUUID(),
        organization_id: org.id,
        variant_id: v.id,
        warehouse_id: warehouseId,
        action: "IN",
        quantity: qty,
        reference_type: "PURCHASE",
        reference_id: purchaseId,
        created_at: new Date(created.getTime() + j * 1000),
      });
    }
  }
  for (const batch of chunks(purchasesData, BATCH)) {
    await prisma.purchase.createMany({ data: batch });
  }
  for (const batch of chunks(purchaseItemsData, BATCH)) {
    await prisma.purchaseItem.createMany({ data: batch });
  }
  for (const batch of chunks(ledgerInData, BATCH)) {
    await prisma.inventoryLedger.createMany({ data: batch });
  }

  // Sales and ledger OUT over past 2 months
  const salesData: {
    id: string;
    organization_id: string;
    customer_id: string;
    warehouse_id: string;
    invoice_number: string;
    sale_date: Date;
    created_at: Date;
    updated_at: Date;
    status: SaleStatus;
    created_by: string;
    payment_type: PaymentType;
    total_amount: number;
  }[] = [];
  const saleItemsData: { id: string; organization_id: string; sale_id: string; variant_id: string; quantity: number }[] = [];
  const ledgerOutData: { id: string; organization_id: string; variant_id: string; warehouse_id: string; action: LedgerAction; quantity: number; reference_type: string; reference_id: string; created_at: Date }[] = [];

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(i * 1.5);
    const created = new Date(now - daysAgo * oneDay);
    const saleId = crypto.randomUUID();
    const customerId = customersData[i % customersData.length].id;
    const warehouseId = warehouses[i % warehouses.length].id;
    salesData.push({
      id: saleId,
      organization_id: org.id,
      customer_id: customerId,
      warehouse_id: warehouseId,
      invoice_number: `SAL-${String(i + 1).padStart(5, "0")}`,
      sale_date: created,
      created_at: created,
      updated_at: created,
      status: SaleStatus.SUBMITTED,
      created_by: usersData[0].id,
      payment_type: i % 2 === 0 ? PaymentType.CASH : PaymentType.CREDIT,
      total_amount: (i % 10 + 1) * 50,
    });
    const v = variantsData[(i * 7) % variantsData.length];
    const qty = 1 + (i % 8);
    saleItemsData.push({
      id: crypto.randomUUID(),
      organization_id: org.id,
      sale_id: saleId,
      variant_id: v.id,
      quantity: qty,
    });
    ledgerOutData.push({
      id: crypto.randomUUID(),
      organization_id: org.id,
      variant_id: v.id,
      warehouse_id: warehouseId,
      action: "OUT",
      quantity: qty,
      reference_type: "SALE",
      reference_id: saleId,
      created_at: created,
    });
  }
  await prisma.sale.createMany({ data: salesData });
  await prisma.saleItem.createMany({ data: saleItemsData });
  await prisma.inventoryLedger.createMany({ data: ledgerOutData });

  // Aggregate per variant+warehouse for inventory and inventory_summaries
  const variantWhQty = new Map<string, number>();
  for (const e of ledgerInData) {
    const key = `${e.variant_id}:${e.warehouse_id}`;
    variantWhQty.set(key, (variantWhQty.get(key) ?? 0) + e.quantity);
  }
  for (const e of ledgerOutData) {
    const key = `${e.variant_id}:${e.warehouse_id}`;
    variantWhQty.set(key, (variantWhQty.get(key) ?? 0) - e.quantity);
  }

  const inventoryData: { id: string; organization_id: string; variant_id: string; warehouse_id: string; quantity: number }[] = [];
  const summariesData: { id: string; organization_id: string; variant_id: string; warehouse_id: string; total_quantity: number; reserved_quantity: number }[] = [];

  variantWhQty.forEach((qty, key) => {
    if (qty <= 0) return;
    const [variant_id, warehouse_id] = key.split(":");
    inventoryData.push({
      id: crypto.randomUUID(),
      organization_id: org.id,
      variant_id,
      warehouse_id,
      quantity: qty,
    });
    summariesData.push({
      id: crypto.randomUUID(),
      organization_id: org.id,
      variant_id,
      warehouse_id,
      total_quantity: qty,
      reserved_quantity: 0,
    });
  });

  // Force some low stock: set first 20 variants to low quantities in first warehouse so "Products to Reorder" table has rows
  const wh0 = warehouses[0].id;
  for (let i = 0; i < Math.min(20, variantsData.length); i++) {
    const v = variantsData[i];
    const lowQty = [2, 3, 5, 1, 8, 4, 0, 6, 7, 9][i % 10];
    const inv = inventoryData.find((x) => x.variant_id === v.id && x.warehouse_id === wh0);
    const sum = summariesData.find((x) => x.variant_id === v.id && x.warehouse_id === wh0);
    if (inv) {
      inv.quantity = lowQty;
      if (sum) sum.total_quantity = lowQty;
    } else {
      inventoryData.push({
        id: crypto.randomUUID(),
        organization_id: org.id,
        variant_id: v.id,
        warehouse_id: wh0,
        quantity: lowQty,
      });
      summariesData.push({
        id: crypto.randomUUID(),
        organization_id: org.id,
        variant_id: v.id,
        warehouse_id: wh0,
        total_quantity: lowQty,
        reserved_quantity: 0,
      });
    }
  }

  for (const batch of chunks(inventoryData, BATCH)) {
    await prisma.inventory.createMany({ data: batch });
  }
  for (const batch of chunks(summariesData, BATCH)) {
    await (prisma as any).inventorySummary.createMany({ data: batch });
  }

  console.log("Creating dashboard metrics...");
  const totalStock = summariesData.reduce((s, x) => s + x.total_quantity, 0);
  const lowCount = summariesData.filter((x) => x.total_quantity < 10).length;
  await (prisma as any).dashboardMetrics.createMany({
    data: warehouses.map((w) => ({
      id: crypto.randomUUID(),
      organization_id: org.id,
      warehouse_id: w.id,
      total_products: productsData.length,
      total_variants: variantsData.length,
      total_stock: totalStock,
      total_sales_today: 5,
      total_purchases_today: 3,
      low_stock_items: lowCount,
      calculated_at: new Date(),
    })),
  });

  console.log("Re-enabling RLS...");
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
    } catch (_) {}
  }

  console.log("Seed completed.");
  console.log("  Org: makso");
  console.log("  Products:", productsData.length, "| Variants:", variantsData.length);
  console.log("  Categories:", categories.length);
  console.log("  Purchases:", purchasesData.length, "| Sales:", salesData.length);
  console.log("  Low-stock rows (for reorder table):", summariesData.filter((x) => x.total_quantity < 10).length);
  console.log("  Login: admin@makso.com / admin1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
