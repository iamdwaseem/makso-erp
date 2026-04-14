/**
 * Seed (current schema) — realistic small dataset for local dev.
 *
 * - Matches current Prisma schema (supplier.code optional, warehouse.phone optional, product/variant SKU fields, variant.size).
 * - TRUNCATES all application tables first (destructive by design).
 *
 * Run: npm run seed:current
 */
import { PrismaClient, LedgerAction, UserRole, PaymentType } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { alnumFromText, normalizeSizeToken } from "../src/utils/sku-format.js";
import { reEnableRlsOnSeedTables, truncateAllApplicationTables } from "./seed-truncate.js";
import { Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_COUNT = Number(process.env.SEED_TARGET_COUNT || 80); // products/purchases/sales scale
const USER_COUNT = Number(process.env.SEED_USER_COUNT || 8);
const ADMIN_COUNT = 1;
const MANAGER_COUNT = Math.max(1, Math.min(2, USER_COUNT - ADMIN_COUNT));

const BATCH_SIZE = 200;

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function createManyInBatches(model: any, data: any[]) {
  for (const batch of chunks(data, BATCH_SIZE)) {
    await model.createMany({ data: batch });
  }
}

function cleanProductCode(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function allocProductCode(i: number): string {
  return `PRD-${String(i + 1).padStart(6, "0")}`;
}

function allocVariantSku(productName: string, color: string, productCode: string, size: string): string {
  const name4 = alnumFromText(productName, 4);
  const color3 = alnumFromText(color, 3);
  const code = cleanProductCode(productCode) || "CODE";
  const sizeTok = normalizeSizeToken(size);
  return `${name4}-${color3}${code}-${sizeTok}`;
}

function pick<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length];
}

async function main() {
  await truncateAllApplicationTables(prisma);

  const now = Date.now();

  console.log("Creating organization…");
  const org = await prisma.organization.create({
    data: { name: "Wareflow Demo Org", slug: "demo" },
  });

  console.log("Creating warehouses…");
  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        organization_id: org.id,
        name: "Dubai Logistics Park",
        code: "DXB-01",
        location: "Jebel Ali, Dubai",
        phone: "+971 4 555 0101",
      },
    }),
    prisma.warehouse.create({
      data: {
        organization_id: org.id,
        name: "Riyadh Central Hub",
        code: "RUH-02",
        location: "Exit 18, Riyadh",
        phone: "+966 11 555 0202",
      },
    }),
    prisma.warehouse.create({
      data: {
        organization_id: org.id,
        name: "Jeddah Port Terminal",
        code: "JED-03",
        location: "Obhur, Jeddah",
        phone: "+966 12 555 0303",
      },
    }),
  ]);

  console.log("Creating users…");
  const adminPasswordHash = await bcrypt.hash("admin1234", 12);
  const managerPasswordHash = await bcrypt.hash("manager1234", 12);
  const staffPasswordHash = await bcrypt.hash("staff1234", 12);

  const usersData = Array.from({ length: USER_COUNT }).map((_, idx) => {
    const isAdmin = idx < ADMIN_COUNT;
    const isManager = idx >= ADMIN_COUNT && idx < ADMIN_COUNT + MANAGER_COUNT;
    const role = isAdmin ? UserRole.ADMIN : isManager ? UserRole.MANAGER : UserRole.STAFF;
    const managerOffset = idx - ADMIN_COUNT + 1;
    const staffOffset = idx - ADMIN_COUNT - MANAGER_COUNT + 1;

    return {
      id: crypto.randomUUID(),
      name: isAdmin ? "Super Admin" : isManager ? `Manager ${managerOffset}` : `Staff ${staffOffset}`,
      email: isAdmin
        ? "admin1@wareflow.com"
        : isManager
          ? `manager${managerOffset}@wareflow.com`
          : `staff${staffOffset}@wareflow.com`,
      password: isAdmin ? adminPasswordHash : isManager ? managerPasswordHash : staffPasswordHash,
      role,
      organization_id: org.id,
    };
  });
  await createManyInBatches(prisma.user, usersData);

  const userAssignments = usersData
    .filter((u) => u.role !== UserRole.ADMIN)
    .map((u, idx) => ({
      user_id: u.id,
      warehouse_id: warehouses[idx % warehouses.length].id,
    }));
  await createManyInBatches((prisma as any).userWarehouse, userAssignments);

  console.log("Creating suppliers + customers…");
  const suppliersData = Array.from({ length: TARGET_COUNT }).map((_, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    name: `Supplier ${i + 1}`,
    // code optional (null allowed)
    code: i % 5 === 0 ? null : `SUP-${String(i + 1).padStart(4, "0")}`,
    email: `supplier${i + 1}@example.com`,
    phone: i % 7 === 0 ? null : `+97150${String(1000000 + i).slice(-7)}`,
    address: `Industrial Zone ${i % 25}, UAE`,
  }));
  await createManyInBatches(prisma.supplier, suppliersData);

  const customersData = Array.from({ length: TARGET_COUNT }).map((_, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    name: `Customer ${i + 1}`,
    phone: `+9714${String(2000000 + i).slice(-7)}`,
    email: i % 6 === 0 ? null : `customer${i + 1}@example.com`,
    address: `Business Area ${i % 50}, UAE`,
  }));
  await createManyInBatches(prisma.customer, customersData);

  console.log("Creating products + variants…");
  const productTypes = ["T-Shirt", "Polo", "Hoodie", "Jacket", "Cap", "Shorts", "Pants"];
  const brands = ["Makso", "Wareflow", "Atlas", "Nova", "Kite", "Orion"];
  const colors = ["Black", "White", "Blue", "Green", "Red", "Grey"];
  const sizes = ["", "S", "M", "L", "XL", "XXL"];

  const productsData = Array.from({ length: TARGET_COUNT }).map((_, i) => {
    const type = pick(productTypes, i);
    const brand = pick(brands, i);
    const name = `${brand} ${type} ${i + 1}`;
    return {
      id: crypto.randomUUID(),
      organization_id: org.id,
      name,
      sku: allocProductCode(i),
      description: `Seeded product: ${brand} ${type}`,
    };
  });
  await createManyInBatches(prisma.product, productsData);

  // 2 variants per product (different color/size) for more realistic UI.
  const variantsData = productsData.flatMap((p, i) => {
    const v1Color = pick(colors, i);
    const v2Color = pick(colors, i + 1);
    const v1Size = pick(sizes, i);
    const v2Size = pick(sizes, i + 2);
    return [
      {
        id: crypto.randomUUID(),
        organization_id: org.id,
        product_id: p.id,
        color: v1Color,
        size: v1Size,
        sku: allocVariantSku(p.name, v1Color, p.sku, v1Size),
      },
      {
        id: crypto.randomUUID(),
        organization_id: org.id,
        product_id: p.id,
        color: v2Color,
        size: v2Size,
        sku: allocVariantSku(p.name, v2Color, p.sku, v2Size),
      },
    ];
  });
  await createManyInBatches(prisma.variant, variantsData);

  console.log("Creating inventory + summaries…");
  const inventoryData = variantsData.map((v, i) => {
    const warehouse = warehouses[i % warehouses.length];
    const quantity = (i % 17) * 7 + 12;
    return {
      id: crypto.randomUUID(),
      organization_id: org.id,
      variant_id: v.id,
      warehouse_id: warehouse.id,
      quantity,
    };
  });
  await createManyInBatches(prisma.inventory, inventoryData);

  const summariesData = inventoryData.map((inv) => ({
    id: crypto.randomUUID(),
    organization_id: inv.organization_id,
    warehouse_id: inv.warehouse_id,
    variant_id: inv.variant_id,
    total_quantity: inv.quantity,
    reserved_quantity: 0,
  }));
  await createManyInBatches((prisma as any).inventorySummary, summariesData);

  console.log("Creating purchases + sales (+ items)…");
  const purchasesData = Array.from({ length: TARGET_COUNT }).map((_, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    supplier_id: suppliersData[i].id,
    warehouse_id: warehouses[i % warehouses.length].id,
    invoice_number: `PUR-${String(i + 1).padStart(6, "0")}`,
    purchase_date: new Date(now - i * 60_000),
    created_at: new Date(now - i * 60_000),
  }));
  await createManyInBatches(prisma.purchase, purchasesData);

  const createdByUserId = usersData[0].id; // admin
  const salesData = Array.from({ length: TARGET_COUNT }).map((_, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    customer_id: customersData[i].id,
    warehouse_id: warehouses[i % warehouses.length].id,
    invoice_number: `SAL-${String(i + 1).padStart(6, "0")}`,
    sale_date: new Date(now - i * 45_000),
    created_at: new Date(now - i * 45_000),
    created_by: createdByUserId,
    payment_type: (i % 2 === 0 ? PaymentType.CASH : PaymentType.CREDIT) as any,
    total_amount: new Prisma.Decimal(((i % 20) + 1) * 125),
  }));
  await createManyInBatches(prisma.sale, salesData);

  // Items: 1-3 lines per document
  const purchaseItemsData: any[] = [];
  const saleItemsData: any[] = [];
  for (let i = 0; i < TARGET_COUNT; i++) {
    const lines = (i % 3) + 1;
    for (let li = 0; li < lines; li++) {
      const v = variantsData[(i * 3 + li) % variantsData.length];
      purchaseItemsData.push({
        id: crypto.randomUUID(),
        organization_id: org.id,
        purchase_id: purchasesData[i].id,
        variant_id: v.id,
        quantity: (li + 1) * ((i % 4) + 1),
      });
      saleItemsData.push({
        id: crypto.randomUUID(),
        organization_id: org.id,
        sale_id: salesData[i].id,
        variant_id: v.id,
        quantity: Math.max(1, (i + li) % 6),
      });
    }
  }
  await createManyInBatches(prisma.purchaseItem, purchaseItemsData);
  await createManyInBatches(prisma.saleItem, saleItemsData);

  console.log("Creating ledger entries (latest IN/OUT per variant)…");
  const ledgerData = Array.from({ length: Math.min(variantsData.length, TARGET_COUNT * 2) }).map((_, i) => {
    const isIn = i % 2 === 0;
    const v = variantsData[i % variantsData.length];
    const wh = warehouses[i % warehouses.length];
    const refPurchase = purchasesData[i % purchasesData.length];
    const refSale = salesData[i % salesData.length];
    return {
      id: crypto.randomUUID(),
      organization_id: org.id,
      variant_id: v.id,
      warehouse_id: wh.id,
      action: (isIn ? LedgerAction.IN : LedgerAction.OUT) as any,
      quantity: (i % 12) + 1,
      reference_type: isIn ? "PURCHASE" : "SALE",
      reference_id: (isIn ? refPurchase.id : refSale.id),
      created_at: new Date(now - i * 30_000),
    };
  });
  await createManyInBatches(prisma.inventoryLedger, ledgerData);

  console.log("Creating dashboard metrics snapshots…");
  const totalStock = summariesData.reduce((sum, s) => sum + (s.total_quantity ?? 0), 0);
  await prisma.dashboardMetrics.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        organization_id: org.id,
        warehouse_id: null,
        total_products: productsData.length,
        total_variants: variantsData.length,
        total_stock: totalStock,
        total_sales_today: Math.floor(TARGET_COUNT / 4),
        total_purchases_today: Math.floor(TARGET_COUNT / 3),
        low_stock_items: summariesData.filter((x) => x.total_quantity < 10).length,
        calculated_at: new Date(),
      },
      ...warehouses.map((w) => ({
        id: crypto.randomUUID(),
        organization_id: org.id,
        warehouse_id: w.id,
        total_products: productsData.length,
        total_variants: variantsData.length,
        total_stock: summariesData
          .filter((s) => s.warehouse_id === w.id)
          .reduce((sum, s) => sum + (s.total_quantity ?? 0), 0),
        total_sales_today: Math.floor(TARGET_COUNT / 5),
        total_purchases_today: Math.floor(TARGET_COUNT / 6),
        low_stock_items: summariesData.filter((x) => x.warehouse_id === w.id && x.total_quantity < 10).length,
        calculated_at: new Date(),
      })),
    ],
  });

  console.log("Re-enabling RLS…");
  await reEnableRlsOnSeedTables(prisma);

  console.log("Seed completed.");
  console.log("  Org: demo");
  console.log("  Warehouses:", warehouses.length);
  console.log("  Products:", productsData.length, "| Variants:", variantsData.length);
  console.log("  Purchases:", purchasesData.length, "| Sales:", salesData.length);
  console.log("  Login: admin1@wareflow.com / admin1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

