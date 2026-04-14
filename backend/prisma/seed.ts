/**
 * Demo/light seed (~50 rows per entity). Run: npm run seed:demo
 *
 * IMPORTANT: TRUNCATES all application tables first — same full wipe as prisma db seed (makso).
 */
import { PrismaClient, LedgerAction, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { alnumFromText, normalizeSizeToken } from "../src/utils/sku-format.js";
import { reEnableRlsOnSeedTables, truncateAllApplicationTables } from "./seed-truncate.js";

const prisma = new PrismaClient();
const BATCH_SIZE = 100;
// Demo seed: light data for fast setup (~50 records per entity)
const TARGET_COUNT = 50;
const USER_COUNT = 5;
const ADMIN_COUNT = 1;
const MANAGER_COUNT = 1;
const STAFF_COUNT = USER_COUNT - ADMIN_COUNT - MANAGER_COUNT;

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
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

async function createManyInBatches(model: any, data: any[]) {
  for (const batch of chunks(data, BATCH_SIZE)) {
    await model.createMany({ data: batch });
  }
}

async function main() {
  await truncateAllApplicationTables(prisma);

  console.log("Creating organization and warehouses...");
  const org = await prisma.organization.create({
    data: { name: "Acme Distribution", slug: "acme" }
  });

  const warehouses = await Promise.all([
    prisma.warehouse.create({ data: { organization_id: org.id, name: "Dubai Logistics Park", code: "DXB-01", location: "Jebel Ali, Dubai" } }),
    prisma.warehouse.create({ data: { organization_id: org.id, name: "Riyadh Central Hub", code: "RUH-02", location: "Exit 18, Riyadh" } }),
    prisma.warehouse.create({ data: { organization_id: org.id, name: "Jeddah Port Terminal", code: "JED-03", location: "Obhur, Jeddah" } }),
    prisma.warehouse.create({ data: { organization_id: org.id, name: "Dammam East Point", code: "DMM-04", location: "Dammam Port Area" } }),
    prisma.warehouse.create({ data: { organization_id: org.id, name: "Abu Dhabi Industrial", code: "AUH-05", location: "Mussafah, Abu Dhabi" } })
  ]);

  console.log("Creating admin, managers, and users...");
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
      name: isAdmin
        ? "Super Admin"
        : isManager
          ? `Manager User ${managerOffset}`
          : `Staff User ${staffOffset}`,
      email: isAdmin
        ? "admin1@wareflow.com"
        : isManager
          ? `manager${managerOffset}@wareflow.com`
          : `staff${staffOffset}@wareflow.com`,
      password: isAdmin ? adminPasswordHash : isManager ? managerPasswordHash : staffPasswordHash,
      role,
      organization_id: org.id
    };
  });
  await createManyInBatches(prisma.user, usersData);

  const userAssignments = usersData
    .filter((u) => u.role !== UserRole.ADMIN)
    .map((u, idx) => ({
      user_id: u.id,
      warehouse_id: warehouses[idx % warehouses.length].id
    }));
  await createManyInBatches((prisma as any).userWarehouse, userAssignments);

  console.log(`Creating ${TARGET_COUNT} suppliers and ${TARGET_COUNT} customers...`);
  const suppliersData = Array.from({ length: TARGET_COUNT }).map((_, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    name: `Supplier Logistics ${i + 1}`,
    code: i % 4 === 0 ? null : `SUP-${String(i + 1).padStart(4, "0")}`,
    email: `contact${i + 1}@supplier.wareflow.com`,
    phone: `+97150${String(1000000 + i).slice(-7)}`,
    address: `Industrial Zone ${i % 25}, UAE`
  }));
  await createManyInBatches(prisma.supplier, suppliersData);

  const customersData = Array.from({ length: TARGET_COUNT }).map((_, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    name: `Retail Client ${i + 1}`,
    email: `client${i + 1}@wareflow.ae`,
    phone: `+9714${String(2000000 + i).slice(-7)}`,
    address: `Business Area ${i % 50}, UAE`
  }));
  await createManyInBatches(prisma.customer, customersData);

  console.log(`Creating ${TARGET_COUNT} products and variants...`);
  const productTypes = ["Smartphone", "Laptop", "Monitor", "Headphones", "Camera", "Printer", "Router"];
  const brands = ["Samsung", "Apple", "Dell", "Sony", "Nikon", "HP", "Cisco"];
  const colors = ["Black", "Silver", "Blue", "White", "Green"];

  const productsData = Array.from({ length: TARGET_COUNT }).map((_, i) => {
    const type = productTypes[i % productTypes.length];
    const brand = brands[i % brands.length];
    const name = `${brand} ${type} Series ${i + 1}`;
    return {
      id: crypto.randomUUID(),
      organization_id: org.id,
      name,
      sku: allocProductCode(i),
      description: `Professional ${type} by ${brand}`
    };
  });
  await createManyInBatches(prisma.product, productsData);

  const variantsData = productsData.map((p, i) => {
    const color = colors[i % colors.length];
    return {
      id: crypto.randomUUID(),
      organization_id: org.id,
      product_id: p.id,
      color,
      sku: allocVariantSku(p.name, color, p.sku, "")
    };
  });
  await createManyInBatches(prisma.variant, variantsData);

  console.log(`Creating ${TARGET_COUNT} inventory and inventory summaries...`);
  const inventoryData = variantsData.map((v, i) => {
    const quantity = Math.floor(Math.random() * 1000) + 10;
    return {
      id: crypto.randomUUID(),
      organization_id: org.id,
      variant_id: v.id,
      warehouse_id: warehouses[i % warehouses.length].id,
      quantity
    };
  });
  await createManyInBatches(prisma.inventory, inventoryData);

  const summariesData = inventoryData.map((inv) => ({
    id: crypto.randomUUID(),
    organization_id: inv.organization_id,
    warehouse_id: inv.warehouse_id,
    variant_id: inv.variant_id,
    total_quantity: inv.quantity,
    reserved_quantity: 0
  }));
  await createManyInBatches((prisma as any).inventorySummary, summariesData);

  console.log(`Creating ${TARGET_COUNT} purchases/sales and line items...`);
  const purchasesData = Array.from({ length: TARGET_COUNT }).map((_, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    supplier_id: suppliersData[i].id,
    warehouse_id: warehouses[i % warehouses.length].id,
    invoice_number: `PUR-${String(i + 1).padStart(6, "0")}`,
    purchase_date: new Date(Date.now() - i * 60000),
    created_at: new Date(Date.now() - i * 60000),
    updated_at: new Date(Date.now() - i * 60000),
    status: "SUBMITTED" as const,
  }));
  await createManyInBatches(prisma.purchase, purchasesData);

  const firstUserId = usersData[0].id;
  const salesData = Array.from({ length: TARGET_COUNT }).map((_, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    customer_id: customersData[i].id,
    warehouse_id: warehouses[i % warehouses.length].id,
    invoice_number: `SAL-${String(i + 1).padStart(6, "0")}`,
    sale_date: new Date(Date.now() - i * 45000),
    created_at: new Date(Date.now() - i * 45000),
    updated_at: new Date(Date.now() - i * 45000),
    status: "SUBMITTED" as const,
    created_by: firstUserId,
    payment_type: i % 2 === 0 ? "CASH" : "CREDIT",
    total_amount: (i % 10 + 1) * 100,
  }));
  await createManyInBatches(prisma.sale, salesData);

  const purchaseItemsData = Array.from({ length: TARGET_COUNT }).map((_, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    purchase_id: purchasesData[i].id,
    variant_id: variantsData[i % variantsData.length].id,
    quantity: (i % 25) + 1
  }));
  await createManyInBatches(prisma.purchaseItem, purchaseItemsData);

  const saleItemsData = Array.from({ length: TARGET_COUNT }).map((_, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    sale_id: salesData[i].id,
    variant_id: variantsData[i % variantsData.length].id,
    quantity: (i % 10) + 1
  }));
  await createManyInBatches(prisma.saleItem, saleItemsData);

  console.log(`Creating ${TARGET_COUNT} inventory ledger entries and scan logs...`);
  const ledgerData = Array.from({ length: TARGET_COUNT }).map((_, i) => {
    const isIn = i % 2 === 0;
    return {
      id: crypto.randomUUID(),
      organization_id: org.id,
      variant_id: variantsData[i % variantsData.length].id,
      warehouse_id: warehouses[i % warehouses.length].id,
      action: (isIn ? "IN" : "OUT") as LedgerAction,
      quantity: (i % 20) + 1,
      reference_type: isIn ? "PURCHASE" : "SALE",
      reference_id: isIn ? purchasesData[i].id : salesData[i].id,
      created_at: new Date(Date.now() - i * 30000)
    };
  });
  await createManyInBatches(prisma.inventoryLedger, ledgerData);

  console.log("Creating sample inventory transfer (submitted)…");
  const anyInv = await prisma.inventory.findFirst({
    where: { organization_id: org.id, quantity: { gte: 25 } },
  });
  const wOther = warehouses.find((w) => w.id !== anyInv?.warehouse_id);
  if (anyInv && wOther) {
    const tid = crypto.randomUUID();
    const moveQty = 20;
    await prisma.$transaction(async (tx) => {
      await tx.transfer.create({
        data: {
          id: tid,
          organization_id: org.id,
          source_warehouse_id: anyInv.warehouse_id,
          target_warehouse_id: wOther.id,
          status: "SUBMITTED",
        },
      });
      await tx.transferItem.create({
        data: { transfer_id: tid, variant_id: anyInv.variant_id, quantity: moveQty },
      });
      await tx.inventory.update({
        where: { id: anyInv.id },
        data: { quantity: anyInv.quantity - moveQty },
      });
      await tx.inventory.upsert({
        where: {
          variant_id_warehouse_id: {
            variant_id: anyInv.variant_id,
            warehouse_id: wOther.id,
          },
        },
        create: {
          organization_id: org.id,
          variant_id: anyInv.variant_id,
          warehouse_id: wOther.id,
          quantity: moveQty,
        },
        update: { quantity: { increment: moveQty } },
      });
      await tx.inventorySummary.updateMany({
        where: {
          organization_id: org.id,
          variant_id: anyInv.variant_id,
          warehouse_id: anyInv.warehouse_id,
        },
        data: { total_quantity: { decrement: moveQty } },
      });
      const existingTgtSum = await tx.inventorySummary.findFirst({
        where: {
          organization_id: org.id,
          variant_id: anyInv.variant_id,
          warehouse_id: wOther.id,
        },
      });
      if (existingTgtSum) {
        await tx.inventorySummary.update({
          where: { id: existingTgtSum.id },
          data: { total_quantity: { increment: moveQty } },
        });
      } else {
        await tx.inventorySummary.create({
          data: {
            organization_id: org.id,
            warehouse_id: wOther.id,
            variant_id: anyInv.variant_id,
            total_quantity: moveQty,
            reserved_quantity: 0,
          },
        });
      }
      await tx.inventoryLedger.createMany({
        data: [
          {
            id: crypto.randomUUID(),
            organization_id: org.id,
            variant_id: anyInv.variant_id,
            warehouse_id: anyInv.warehouse_id,
            action: "OUT",
            quantity: moveQty,
            reference_type: "TRANSFER_OUT",
            reference_id: tid,
          },
          {
            id: crypto.randomUUID(),
            organization_id: org.id,
            variant_id: anyInv.variant_id,
            warehouse_id: wOther.id,
            action: "IN",
            quantity: moveQty,
            reference_type: "TRANSFER_IN",
            reference_id: tid,
          },
        ],
      });
    });
  }

  const scanLogsData = Array.from({ length: TARGET_COUNT }).map((_, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    variant_id: variantsData[i % variantsData.length].id,
    warehouse_id: warehouses[i % warehouses.length].id,
    action: (i % 2 === 0 ? "IN" : "OUT") as LedgerAction,
    quantity: 1 + (i % 3),
    station_id: null,
    created_at: new Date(Date.now() - i * 15000)
  }));
  await createManyInBatches(prisma.scanLog, scanLogsData);

  console.log("Creating dashboard metrics snapshots...");
  const dashboardMetricsData = warehouses.map((w, i) => ({
    id: crypto.randomUUID(),
    organization_id: org.id,
    warehouse_id: w.id,
    total_products: TARGET_COUNT,
    total_variants: TARGET_COUNT,
    total_stock: inventoryData
      .filter((inv) => inv.warehouse_id === w.id)
      .reduce((sum, inv) => sum + inv.quantity, 0),
    total_sales_today: Math.floor(TARGET_COUNT / warehouses.length) - i * 5,
    total_purchases_today: Math.floor(TARGET_COUNT / warehouses.length) - i * 3,
    low_stock_items: 100 + i * 5,
    calculated_at: new Date()
  }));
  await createManyInBatches((prisma as any).dashboardMetrics, dashboardMetricsData);

  console.log("Re-enabling RLS...");
  await reEnableRlsOnSeedTables(prisma);

  console.log("Seed completed successfully.");
  console.log(`Organization: ${org.slug}`);
  console.log(`Admins created: ${ADMIN_COUNT}`);
  console.log(`Managers created: ${MANAGER_COUNT}`);
  console.log(`Staff created: ${STAFF_COUNT}`);
  console.log(`Total users created: ${USER_COUNT}`);
  console.log(`Records per major entity target: ${TARGET_COUNT}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
