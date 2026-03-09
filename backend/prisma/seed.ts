/**
 * Heavy Seed — 1,000 Products, 2,000 Variants, inventory + 5,000 ledger entries
 *
 * Uses batched createMany() for performance — avoids the N+1 single-create loop
 * from the naive approach. Should complete in ~10–30s instead of minutes.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();
const BATCH = 100; // rows per insert

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uuid() {
  return crypto.randomUUID();
}

const COLORS = [
  "Black", "White", "Red", "Blue", "Green", "Grey", "Navy",
  "Ivory", "Silver", "Charcoal", "Midnight Blue", "Rose Gold",
];

const CATEGORIES = [
  "Electronics", "Accessories", "Apparel", "Footwear",
  "Bags", "Stationery", "Tools", "Sports", "Home", "Beauty",
];

async function main() {
  console.log("🧹  Clearing database...");
  await prisma.scanLog.deleteMany();
  await prisma.inventoryLedger.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ─────────────────────────────────────────────────────────────────
  console.log("👤  Seeding users...");
  await prisma.user.createMany({
    data: [
      { name: "Admin",    email: "admin@wareflow.com",  password: await bcrypt.hash("admin1234",   12) },
      { name: "Waseem",   email: "waseem@wareflow.com", password: await bcrypt.hash("wareflow123", 12) },
      { name: "Demo",     email: "demo@wareflow.com",   password: await bcrypt.hash("demo1234",    12) },
    ],
  });

  // ── Suppliers ─────────────────────────────────────────────────────────────
  console.log("🏭  Seeding suppliers...");
  const supplierData = [
    { name: "Acme Electronics",  phone: "+1-555-0100", email: "sales@acme.com",           address: "123 Tech Lane, Silicon Valley, CA" },
    { name: "Globex Corp",       phone: "+1-555-0101", email: "supply@globex.com",         address: "456 Industry Blvd, Austin, TX" },
    { name: "SuperSupplies Co",  phone: "+1-555-0102", email: "orders@supersupplies.io",   address: "789 Commerce St, New York, NY" },
    { name: "TechNova Ltd",      phone: "+1-555-0103", email: "procurement@technova.com",  address: "321 Innovation Dr, Seattle, WA" },
    { name: "Zenith Wholesale",  phone: "+1-555-0104", email: "zen@zenith.co",             address: "55 Market St, San Francisco, CA" },
    { name: "Polar Imports",     phone: "+1-555-0105", email: "import@polarsupply.com",    address: "18 Arctic Blvd, Anchorage, AK" },
  ];
  await prisma.supplier.createMany({ data: supplierData });
  const suppliers = await prisma.supplier.findMany();

  // ── Customers ─────────────────────────────────────────────────────────────
  console.log("👥  Seeding customers...");
  const customerData = Array.from({ length: 20 }, (_, i) => ({
    name: `Customer ${i + 1}`,
    phone: `+1-555-${String(1000 + i).padStart(4, "0")}`,
    email: `customer${i + 1}@example.com`,
    address: `${rand(1, 999)} Example St, City ${i + 1}, US`,
  }));
  await prisma.customer.createMany({ data: customerData });
  const customers = await prisma.customer.findMany();

  // ── Products ──────────────────────────────────────────────────────────────
  console.log("📦  Seeding 1,000 products...");
  const N_PRODUCTS = 1000;

  const productRows = Array.from({ length: N_PRODUCTS }, (_, i) => {
    const cat = CATEGORIES[i % CATEGORIES.length];
    const initials = cat.split(" ").map(w => w[0]).join("") + "P";
    return {
      name: `${cat} Product ${i + 1}`,
      sku: `${initials}-${String(i + 1).padStart(4, "0")}`,
      description: `Auto-generated product #${i + 1} in category ${cat}.`,
    };
  });

  // Batch insert
  for (let b = 0; b < productRows.length; b += BATCH) {
    await prisma.product.createMany({ data: productRows.slice(b, b + BATCH) });
    process.stdout.write(`\r  products: ${Math.min(b + BATCH, N_PRODUCTS)}/${N_PRODUCTS}`);
  }
  console.log();
  const products = await prisma.product.findMany({ select: { id: true, sku: true } });

  // ── Variants (2 per product = 2,000 total) ────────────────────────────────
  console.log("🏷️   Seeding 2,000 variants...");
  const variantRows = products.flatMap(p => {
    const colorA = COLORS[rand(0, COLORS.length - 1)];
    let colorB = COLORS[rand(0, COLORS.length - 1)];
    while (colorB === colorA) colorB = COLORS[rand(0, COLORS.length - 1)];
    const caA = colorA.split(" ").map(w => w[0].toUpperCase()).join("");
    const caB = colorB.split(" ").map(w => w[0].toUpperCase()).join("");
    return [
      { product_id: p.id, color: colorA, sku: `${p.sku}-${caA}` },
      { product_id: p.id, color: colorB, sku: `${p.sku}-${caB}-2` },
    ];
  });

  for (let b = 0; b < variantRows.length; b += BATCH) {
    await prisma.variant.createMany({ data: variantRows.slice(b, b + BATCH) });
    process.stdout.write(`\r  variants: ${Math.min(b + BATCH, variantRows.length)}/${variantRows.length}`);
  }
  console.log();
  const variants = await prisma.variant.findMany({ select: { id: true } });

  // ── Inventory (one row per variant) ───────────────────────────────────────
  console.log("📊  Seeding inventory for all variants...");
  const inventoryRows = variants.map(v => ({
    variant_id: v.id,
    quantity: rand(0, 200),
  }));

  for (let b = 0; b < inventoryRows.length; b += BATCH) {
    await prisma.inventory.createMany({ data: inventoryRows.slice(b, b + BATCH) });
    process.stdout.write(`\r  inventory: ${Math.min(b + BATCH, inventoryRows.length)}/${inventoryRows.length}`);
  }
  console.log();

  // ── Ledger entries (~5,000, 2-3 per variant) ─────────────────────────────
  console.log("📋  Seeding 5,000+ ledger entries...");

  const supplierIds  = suppliers.map(s => s.id);
  const customerIds  = customers.map(c => c.id);

  // Create some purchase/sale records to use as reference_ids
  const purchaseIds: string[] = [];
  const saleIds: string[]     = [];

  // Seed 20 purchases and 20 sales for reference IDs
  await prisma.purchase.createMany({
    data: Array.from({ length: 20 }, () => ({
      supplier_id: supplierIds[rand(0, supplierIds.length - 1)],
      invoice_number: `PUR-BULK-${rand(10000, 99999)}`,
    })),
  });
  const purchases = await prisma.purchase.findMany({ select: { id: true } });
  purchases.forEach(p => purchaseIds.push(p.id));

  await prisma.sale.createMany({
    data: Array.from({ length: 20 }, () => ({
      customer_id: customerIds[rand(0, customerIds.length - 1)],
      invoice_number: `SAL-BULK-${rand(10000, 99999)}`,
    })),
  });
  const sales = await prisma.sale.findMany({ select: { id: true } });
  sales.forEach(s => saleIds.push(s.id));

  // Build ledger rows — ~2-3 per variant ≈ 4,000–6,000 rows
  const ledgerRows: {
    variant_id: string;
    action: "IN" | "OUT";
    quantity: number;
    reference_type: string;
    reference_id: string;
  }[] = [];

  for (const v of variants) {
    const numEntries = rand(2, 3);
    for (let e = 0; e < numEntries; e++) {
      const isIn = e === 0 || Math.random() > 0.5; // first entry is always IN
      ledgerRows.push({
        variant_id: v.id,
        action: isIn ? "IN" : "OUT",
        quantity: rand(1, 50),
        reference_type: isIn ? "PURCHASE" : "SALE",
        reference_id: isIn
          ? purchaseIds[rand(0, purchaseIds.length - 1)]
          : saleIds[rand(0, saleIds.length - 1)],
      });
    }
  }

  for (let b = 0; b < ledgerRows.length; b += BATCH) {
    await prisma.inventoryLedger.createMany({ data: ledgerRows.slice(b, b + BATCH) });
    process.stdout.write(`\r  ledger: ${Math.min(b + BATCH, ledgerRows.length)}/${ledgerRows.length}`);
  }
  console.log();

  console.log("");
  console.log("✅  Heavy seed complete!");
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  📦  Products        : ${N_PRODUCTS}`);
  console.log(`  🏷️   Variants        : ${variantRows.length}`);
  console.log(`  📊  Inventory rows  : ${inventoryRows.length}`);
  console.log(`  📋  Ledger entries  : ${ledgerRows.length}`);
  console.log(`  🏭  Suppliers       : ${suppliers.length}`);
  console.log(`  👥  Customers       : ${customers.length}`);
  console.log("");
  console.log("  👤  Login credentials:");
  console.log("  ┌──────────────────────────────────────────────┐");
  console.log("  │ admin@wareflow.com   │ admin1234             │");
  console.log("  │ waseem@wareflow.com  │ wareflow123           │");
  console.log("  │ demo@wareflow.com    │ demo1234              │");
  console.log("  └──────────────────────────────────────────────┘");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
