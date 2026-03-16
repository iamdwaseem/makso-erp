import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

/** Parse a CSV line (handles quoted fields). */
function parseCsvLine(line: string): string[] {
  return line.split(",").map((s) => s.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
}

/** Try to load MAKSO products from CSV. Returns rows [product_name, category, description] or null if file missing. */
function loadMaksoCsv(): { name: string; category: string; description: string }[] | null {
  const cwd = process.cwd();
  const paths = [
    join(cwd, "scripts", "makso-products.csv"),
    join(cwd, "..", "scripts", "makso-products.csv"),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    try {
      const csv = readFileSync(p, "utf8");
      const lines = csv.split(/\r?\n/).filter((l) => l.trim());
      const dataLines = lines.slice(1);
      if (dataLines.length === 0) return null;
      const rows: { name: string; category: string; description: string }[] = [];
      for (const line of dataLines) {
        const parts = parseCsvLine(line);
        const name = parts[0]?.trim();
        if (!name) continue;
        rows.push({
          name,
          category: parts[1]?.trim() || "Default",
          description: parts[2]?.trim() || "",
        });
      }
      return rows.length ? rows : null;
    } catch {
      continue;
    }
  }
  return null;
}

/** Date N months ago (first day of that month at noon UTC) */
function monthAgo(monthsAgo: number): Date {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - monthsAgo);
  d.setUTCDate(1);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

/** Random day within a month */
function dayInMonth(year: number, month: number): Date {
  const day = 1 + Math.floor(Math.random() * 25);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 12);

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { slug: "acme-erp" },
    update: {},
    create: { name: "Acme ERP Demo", slug: "acme-erp" },
  });
  console.log("Organization:", org.slug);

  // 2. Admin user
  const user = await prisma.user.upsert({
    where: { email: "admin@acme-erp.local" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@acme-erp.local",
      password: hashedPassword,
      organization_id: org.id,
      role: "ADMIN",
    },
  });
  console.log("User:", user.email);

  // --- Delete existing transactional data for this org (so we can reseed cleanly) ---
  const orgId = org.id;

  const existingSales = await prisma.sale.findMany({ where: { organization_id: orgId }, select: { id: true } });
  const saleIds = existingSales.map((s) => s.id);
  if (saleIds.length > 0) {
    await prisma.salePayment.deleteMany({ where: { sale_id: { in: saleIds } } });
    await prisma.saleItem.deleteMany({ where: { sale_id: { in: saleIds } } });
    const creditNotes = await prisma.creditNote.findMany({ where: { sale_id: { in: saleIds } }, select: { id: true } });
    for (const cn of creditNotes) await prisma.creditNoteItem.deleteMany({ where: { credit_note_id: cn.id } });
    await prisma.creditNote.deleteMany({ where: { organization_id: orgId } });
    await prisma.sale.deleteMany({ where: { organization_id: orgId } });
  }

  const purchaseIds = (await prisma.purchase.findMany({ where: { organization_id: orgId }, select: { id: true } })).map((p) => p.id);
  if (purchaseIds.length > 0) {
    await prisma.purchaseItem.deleteMany({ where: { purchase_id: { in: purchaseIds } } });
    await prisma.purchase.deleteMany({ where: { organization_id: orgId } });
  }

  await prisma.grnItem.deleteMany({ where: { grn: { organization_id: orgId } } });
  await prisma.grn.deleteMany({ where: { organization_id: orgId } });
  await prisma.gdnItem.deleteMany({ where: { gdn: { organization_id: orgId } } });
  await prisma.gdn.deleteMany({ where: { organization_id: orgId } });
  await prisma.transferItem.deleteMany({ where: { transfer: { organization_id: orgId } } });
  await prisma.transfer.deleteMany({ where: { organization_id: orgId } });
  await prisma.inventoryLedger.deleteMany({ where: { organization_id: orgId } });
  await prisma.adjustment.deleteMany({ where: { organization_id: orgId } });
  await prisma.inventory.deleteMany({ where: { organization_id: orgId } });
  await prisma.userWarehouse.deleteMany({ where: { user_id: user.id } });

  // Delete masters so we can recreate with more data (optional: comment out to keep existing masters)
  await prisma.supplier.deleteMany({ where: { organization_id: orgId } });
  await prisma.customer.deleteMany({ where: { organization_id: orgId } });
  const productIds = (await prisma.product.findMany({ where: { organization_id: orgId }, select: { id: true } })).map((p) => p.id);
  if (productIds.length > 0) {
    await prisma.variant.deleteMany({ where: { product_id: { in: productIds } } });
    await prisma.product.deleteMany({ where: { organization_id: orgId } });
  }
  await prisma.warehouse.deleteMany({ where: { organization_id: orgId } });

  // 3. Suppliers (10, all fields)
  const supplierData = [
    { name: "Tip Top Furniture", phone: "+971501234567", email: "orders@tiptop.ae", address: "Industrial Area 12, Dubai, UAE" },
    { name: "Al Meera Office Supplies", phone: "+97444123456", email: "supply@almeera.qa", address: "Doha, Qatar" },
    { name: "Gulf Electronics LLC", phone: "+97142234567", email: "sales@gulf-electronics.ae", address: "Jebel Ali Free Zone, Dubai" },
    { name: "Desert Paper Co", phone: "+97143334567", email: "orders@desertpaper.ae", address: "Ras Al Khor, Dubai" },
    { name: "Emirates Packaging", phone: "+971504556789", email: "info@emiratespack.ae", address: "Al Quoz, Dubai" },
    { name: "Arabian Office Solutions", phone: "+971556789012", email: "sales@arabianoffice.ae", address: "Business Bay, Dubai" },
    { name: "MENA Lighting", phone: "+971434567890", email: "orders@menalighting.ae", address: "Al Quoz Industrial, Dubai" },
    { name: "Gulf Stationery", phone: "+971521234567", email: "procurement@gulfstationery.ae", address: "Deira, Dubai" },
    { name: "Tech Supply FZCO", phone: "+971551234567", email: "support@techsupply.ae", address: "Dubai Internet City" },
    { name: "Prime Furniture Trading", phone: "+971561234567", email: "sales@primefurniture.ae", address: "Jebel Ali, Dubai" },
  ];
  await prisma.supplier.createMany({
    data: supplierData.map((s) => ({ organization_id: orgId, ...s })),
  });
  const supplierList = await prisma.supplier.findMany({ where: { organization_id: orgId } });
  console.log("Suppliers:", supplierList.length);

  // 4. Customers (10)
  const customerData = [
    { name: "ABC Trading LLC", phone: "+971551234567", email: "accounts@abctrading.ae", address: "Business Bay, Dubai" },
    { name: "XYZ Retail FZCO", phone: "+971561234567", email: "procurement@xyzretail.ae", address: "Mirdif, Dubai" },
    { name: "Metro Mart", phone: "+971571234567", email: "orders@metromart.ae", address: "Deira, Dubai" },
    { name: "Global Ventures", phone: "+971581234567", email: "finance@globalv.ae", address: "DIFC, Dubai" },
    { name: "Sunrise Trading", phone: "+971591234567", email: "orders@sunrisetrading.ae", address: "JLT, Dubai" },
    { name: "Desert Rose LLC", phone: "+971501987654", email: "accounts@desertrose.ae", address: "Al Barsha, Dubai" },
    { name: "Pearl Enterprises", phone: "+971512345678", email: "procurement@pearl.ae", address: "Sheikh Zayed Road, Dubai" },
    { name: "Oasis Supplies", phone: "+971523456789", email: "billing@oasissupplies.ae", address: "Dubai Marina" },
    { name: "Falcon Trading Co", phone: "+971534567890", email: "sales@falcontrading.ae", address: "Al Karama, Dubai" },
    { name: "Horizon Distribution", phone: "+971545678901", email: "accounts@horizondist.ae", address: "Jebel Ali, Dubai" },
  ];
  await prisma.customer.createMany({
    data: customerData.map((c) => ({ organization_id: orgId, ...c })),
  });
  const customerList = await prisma.customer.findMany({ where: { organization_id: orgId } });
  console.log("Customers:", customerList.length);

  // 5. Products + 6. Variants — from MAKSO CSV if present, else fallback list
  const variantList: { id: string; product_id: string; sku: string; color: string; reorder_level: number; valuation_rate: number }[] = [];
  const maksoRows = loadMaksoCsv();

  if (maksoRows && maksoRows.length > 0) {
    console.log("Products: loading from MAKSO CSV (" + maksoRows.length + " rows)");
    for (let i = 0; i < maksoRows.length; i++) {
      const row = maksoRows[i];
      const productSku = `MAKSO-${String(i + 1).padStart(3, "0")}`;
      const product = await prisma.product.create({
        data: {
          organization_id: orgId,
          name: row.name,
          sku: productSku,
          description: row.description || null,
        },
      });
      const variantSku = `${productSku}-V`;
      const v = await prisma.variant.create({
        data: {
          organization_id: orgId,
          product_id: product.id,
          color: row.category || "Default",
          sku: variantSku,
          reorder_level: 5 + Math.floor(Math.random() * 15),
          valuation_rate: 20 + Math.floor(Math.random() * 180),
        },
      });
      variantList.push({
        id: v.id,
        product_id: v.product_id,
        sku: v.sku,
        color: v.color,
        reorder_level: v.reorder_level,
        valuation_rate: Number(v.valuation_rate),
      });
    }
    console.log("Products:", maksoRows.length, "| Variants:", variantList.length);
  } else {
    const productData = [
      { name: "Office Chair Pro", sku: "PROD-CHAIR-001", description: "Ergonomic office chair with lumbar support" },
      { name: "Desk Lamp LED", sku: "PROD-LAMP-002", description: "Adjustable LED desk lamp" },
      { name: "A4 Paper Ream", sku: "PROD-PAPER-003", description: "80gsm white A4 copy paper, 500 sheets" },
      { name: "Laptop Stand", sku: "PROD-STAND-004", description: "Aluminum laptop stand" },
      { name: "Wireless Mouse", sku: "PROD-MOUSE-005", description: "Ergonomic wireless mouse" },
      { name: "Filing Cabinet 2-Drawer", sku: "PROD-CAB-006", description: "Metal filing cabinet with lock" },
      { name: "Whiteboard 90x60cm", sku: "PROD-WB-007", description: "Wall-mount whiteboard with markers" },
      { name: "Stapler Heavy Duty", sku: "PROD-STAP-008", description: "Metal stapler for 100 sheets" },
      { name: "Desk Organizer", sku: "PROD-ORG-009", description: "Multi-compartment desk organizer" },
      { name: "Monitor Arm", sku: "PROD-ARM-010", description: "Single monitor VESA mount" },
      { name: "Keyboard Wired", sku: "PROD-KB-011", description: "USB wired keyboard" },
      { name: "Notebook A5 Pack", sku: "PROD-NB-012", description: "Pack of 5 ruled A5 notebooks" },
      { name: "Pen Set Blue", sku: "PROD-PEN-013", description: "Box of 12 blue ballpoint pens" },
      { name: "Highlighters 5-Pack", sku: "PROD-HL-014", description: "Assorted highlighters" },
      { name: "Sticky Notes 10-Pack", sku: "PROD-STICK-015", description: "Yellow sticky notes 76x76mm" },
      { name: "Folder A4 Pack", sku: "PROD-FOLD-016", description: "Pack of 25 manila folders" },
      { name: "Tape Dispenser", sku: "PROD-TAPE-017", description: "Desktop tape dispenser" },
      { name: "Calculator Desktop", sku: "PROD-CALC-018", description: "12-digit desktop calculator" },
    ];
    await prisma.product.createMany({
      data: productData.map((p) => ({ organization_id: orgId, ...p })),
    });
    const productList = await prisma.product.findMany({ where: { organization_id: orgId } });
    console.log("Products:", productList.length);

    const colors = ["Black", "White", "Grey"];
    for (const p of productList) {
      const numColors = productList.indexOf(p) % 3 === 0 ? 3 : 2;
      for (let c = 0; c < numColors; c++) {
        const color = colors[c];
        const sku = `${p.sku}-${color.slice(0, 3).toUpperCase()}`;
        const v = await prisma.variant.create({
          data: {
            organization_id: orgId,
            product_id: p.id,
            color,
            sku,
            reorder_level: 5 + Math.floor(Math.random() * 15),
            valuation_rate: 20 + Math.floor(Math.random() * 180),
          },
        });
        variantList.push({
          id: v.id,
          product_id: v.product_id,
          sku: v.sku,
          color: v.color,
          reorder_level: v.reorder_level,
          valuation_rate: Number(v.valuation_rate),
        });
      }
    }
    console.log("Variants:", variantList.length);
  }

  // 7. Warehouses (4)
  await prisma.warehouse.createMany({
    data: [
      { organization_id: orgId, name: "Main Warehouse", code: "WH-MAIN", location: "Jebel Ali, Dubai" },
      { organization_id: orgId, name: "Store Front", code: "WH-STORE", location: "Downtown Dubai" },
      { organization_id: orgId, name: "Cold Storage", code: "WH-COLD", location: "Dubai Industrial City" },
      { organization_id: orgId, name: "Distribution Center", code: "WH-DC", location: "Al Quoz, Dubai" },
    ],
  });
  const warehouseList = await prisma.warehouse.findMany({ where: { organization_id: orgId } });
  console.log("Warehouses:", warehouseList.length);

  // 8. User–warehouse (all)
  for (const wh of warehouseList) {
    await prisma.userWarehouse.upsert({
      where: { user_id_warehouse_id: { user_id: user.id, warehouse_id: wh.id } },
      update: {},
      create: { user_id: user.id, warehouse_id: wh.id },
    });
  }
  console.log("UserWarehouse assigned");

  // 9. Inventory: every variant in at least one warehouse, many in 2–3 (for item groups / low stock)
  for (let i = 0; i < variantList.length; i++) {
    const v = variantList[i];
    const numWarehouses = 1 + (i % 3);
    for (let w = 0; w < numWarehouses; w++) {
      const wh = warehouseList[w % warehouseList.length];
      const qty = 15 + Math.floor(Math.random() * 120);
      await prisma.inventory.upsert({
        where: { variant_id_warehouse_id: { variant_id: v.id, warehouse_id: wh.id } },
        update: { quantity: qty },
        create: {
          organization_id: orgId,
          variant_id: v.id,
          warehouse_id: wh.id,
          quantity: qty,
        },
      });
    }
  }
  console.log("Inventory populated");

  const wh = warehouseList[0];
  const wh2 = warehouseList[1];
  const sup = supplierList[0];
  const cust = customerList[0];

  // 10. Sales: 4–5 per month over last 12 months (so trend chart is full)
  const now = new Date();
  for (let m = 0; m < 12; m++) {
    const year = now.getFullYear() - (m < now.getMonth() + 1 ? 0 : 1);
    const month = now.getMonth() - m + (m <= now.getMonth() ? 0 : 12);
    for (let s = 0; s < 4 + (m % 2); s++) {
      const created = dayInMonth(year, month + 1);
      const numItems = 1 + (s % 3);
      const items: { variant_id: string; quantity: number; price: number }[] = [];
      let total = 0;
      for (let i = 0; i < numItems; i++) {
        const v = variantList[(m * 3 + s + i) % variantList.length];
        const qty = 2 + (i % 5);
        const price = 30 + Math.floor(Math.random() * 200);
        items.push({ variant_id: v.id, quantity: qty, price });
        total += qty * price;
      }
      const status = s % 4 === 0 ? "DRAFT" : "SUBMITTED";
      const sale = await prisma.sale.create({
        data: {
          organization_id: orgId,
          customer_id: customerList[s % customerList.length].id,
          warehouse_id: warehouseList[s % warehouseList.length].id,
          status,
          total_amount: total,
          created_at: created,
          items: { create: items },
          ...(status === "SUBMITTED" && (s % 3 !== 0)
            ? { payments: { create: [{ amount: Math.round(total * 0.5) }, { amount: total - Math.round(total * 0.5) }] } }
            : {}),
        },
      });
      if (status === "SUBMITTED" && sale.id) {
        // Ledger entries for inventory trend
        for (const it of items) {
          await prisma.inventoryLedger.create({
            data: {
              organization_id: orgId,
              variant_id: it.variant_id,
              warehouse_id: warehouseList[s % warehouseList.length].id,
              quantity: -it.quantity,
              type: "SALE",
              reference_id: sale.id,
              created_at: created,
            },
          });
        }
      }
    }
  }
  console.log("Sales (12 months) + ledger entries");

  // 11. Purchases: 4–5 per month over last 12 months
  for (let m = 0; m < 12; m++) {
    const year = now.getFullYear() - (m < now.getMonth() + 1 ? 0 : 1);
    const month = now.getMonth() - m + (m <= now.getMonth() ? 0 : 12);
    for (let p = 0; p < 4 + (m % 2); p++) {
      const created = dayInMonth(year, month + 1);
      const numItems = 1 + (p % 3);
      const items: { variant_id: string; quantity: number; cost: number }[] = [];
      let total = 0;
      for (let i = 0; i < numItems; i++) {
        const v = variantList[(m * 5 + p + i) % variantList.length];
        const qty = 5 + (i % 15);
        const cost = 15 + Math.floor(Math.random() * 80);
        items.push({ variant_id: v.id, quantity: qty, cost });
        total += qty * cost;
      }
      const status = p % 5 === 0 ? "DRAFT" : "SUBMITTED";
      const purchase = await prisma.purchase.create({
        data: {
          organization_id: orgId,
          supplier_id: supplierList[p % supplierList.length].id,
          warehouse_id: warehouseList[p % warehouseList.length].id,
          status,
          total_amount: total,
          created_at: created,
          items: { create: items },
        },
      });
      if (status === "SUBMITTED" && purchase.id) {
        for (const it of items) {
          await prisma.inventoryLedger.create({
            data: {
              organization_id: orgId,
              variant_id: it.variant_id,
              warehouse_id: warehouseList[p % warehouseList.length].id,
              quantity: it.quantity,
              type: "PURCHASE",
              reference_id: purchase.id,
              created_at: created,
            },
          });
        }
      }
    }
  }
  console.log("Purchases (12 months) + ledger");

  // 12. GRNs (15) spread over months
  for (let g = 0; g < 15; g++) {
    const m = g % 12;
    const created = dayInMonth(now.getFullYear() - (m <= now.getMonth() ? 0 : 1), (now.getMonth() - m + 12) % 12 + 1);
    const grn = await prisma.grn.create({
      data: {
        organization_id: orgId,
        warehouse_id: warehouseList[g % warehouseList.length].id,
        supplier_id: supplierList[g % supplierList.length].id,
        status: "SUBMITTED",
        created_at: created,
        items: {
          create: [
            { variant_id: variantList[g % variantList.length].id, quantity: 10 + g * 2 },
            { variant_id: variantList[(g + 1) % variantList.length].id, quantity: 5 + g },
          ],
        },
      },
    });
    for (const it of [{ variant_id: variantList[g % variantList.length].id, quantity: 10 + g * 2 }, { variant_id: variantList[(g + 1) % variantList.length].id, quantity: 5 + g }]) {
      await prisma.inventoryLedger.create({
        data: {
          organization_id: orgId,
          variant_id: it.variant_id,
          warehouse_id: warehouseList[g % warehouseList.length].id,
          quantity: it.quantity,
          type: "GRN",
          reference_id: grn.id,
          created_at: created,
        },
      });
    }
  }
  console.log("GRNs created");

  // 13. GDNs (15)
  for (let g = 0; g < 15; g++) {
    const m = g % 12;
    const created = dayInMonth(now.getFullYear() - (m <= now.getMonth() ? 0 : 1), (now.getMonth() - m + 12) % 12 + 1);
    const gdn = await prisma.gdn.create({
      data: {
        organization_id: orgId,
        warehouse_id: warehouseList[g % warehouseList.length].id,
        customer_id: customerList[g % customerList.length].id,
        status: "SUBMITTED",
        created_at: created,
        items: {
          create: [
            { variant_id: variantList[g % variantList.length].id, quantity: 3 },
            { variant_id: variantList[(g + 2) % variantList.length].id, quantity: 4 },
          ],
        },
      },
    });
    for (const it of [{ variant_id: variantList[g % variantList.length].id, quantity: -3 }, { variant_id: variantList[(g + 2) % variantList.length].id, quantity: -4 }]) {
      await prisma.inventoryLedger.create({
        data: {
          organization_id: orgId,
          variant_id: it.variant_id,
          warehouse_id: warehouseList[g % warehouseList.length].id,
          quantity: it.quantity,
          type: "GDN",
          reference_id: gdn.id,
          created_at: created,
        },
      });
    }
  }
  console.log("GDNs created");

  // 14. Transfers (12)
  for (let t = 0; t < 12; t++) {
    const m = t % 12;
    const created = dayInMonth(now.getFullYear() - (m <= now.getMonth() ? 0 : 1), (now.getMonth() - m + 12) % 12 + 1);
    await prisma.transfer.create({
      data: {
        organization_id: orgId,
        source_warehouse_id: warehouseList[t % warehouseList.length].id,
        target_warehouse_id: warehouseList[(t + 1) % warehouseList.length].id,
        status: "SUBMITTED",
        created_at: created,
        items: {
          create: [
            { variant_id: variantList[t % variantList.length].id, quantity: 5 },
            { variant_id: variantList[(t + 1) % variantList.length].id, quantity: 8 },
          ],
        },
      },
    });
  }
  console.log("Transfers created");

  // 15. Adjustments: mix of positive and negative (for gain/loss chart)
  for (let a = 0; a < 25; a++) {
    const v = variantList[a % variantList.length];
    const qty = (a % 2 === 0 ? 1 : -1) * (2 + (a % 5));
    await prisma.adjustment.create({
      data: {
        organization_id: orgId,
        warehouse_id: warehouseList[a % warehouseList.length].id,
        variant_id: v.id,
        quantity: qty,
        reason: qty > 0 ? "Stock count correction" : "Damaged write-off",
        created_at: dayInMonth(now.getFullYear(), (now.getMonth() + (a % 6)) % 12 + 1),
      },
    });
  }
  console.log("Adjustments (gain/loss) created");

  // 16. Extra inventory ledger entries for inventory trend (TRANSFER_IN/OUT)
  const transfers = await prisma.transfer.findMany({
    where: { organization_id: orgId },
    take: 12,
    include: { items: true },
  });
  for (const tr of transfers) {
    const srcId = tr.source_warehouse_id;
    const tgtId = tr.target_warehouse_id;
    const createdAt = tr.created_at;
    for (const it of tr.items) {
      await prisma.inventoryLedger.create({
        data: {
          organization_id: orgId,
          variant_id: it.variant_id,
          warehouse_id: srcId,
          quantity: -it.quantity,
          type: "TRANSFER_OUT",
          reference_id: tr.id,
          created_at: createdAt,
        },
      });
      await prisma.inventoryLedger.create({
        data: {
          organization_id: orgId,
          variant_id: it.variant_id,
          warehouse_id: tgtId,
          quantity: it.quantity,
          type: "TRANSFER_IN",
          reference_id: tr.id,
          created_at: createdAt,
        },
      });
    }
  }
  console.log("Ledger transfer entries");

  // 17. Credit notes (8) on submitted sales
  const submittedSales = await prisma.sale.findMany({
    where: { organization_id: orgId, status: "SUBMITTED" },
    take: 8,
  });
  for (let i = 0; i < submittedSales.length; i++) {
    const sale = submittedSales[i];
    const v = variantList[i % variantList.length];
    await prisma.creditNote.create({
      data: {
        organization_id: orgId,
        sale_id: sale.id,
        amount: 80 + i * 20,
        reason: "Return - customer request",
        status: "SUBMITTED",
        created_at: dayInMonth(now.getFullYear(), now.getMonth() + 1),
        items: { create: [{ variant_id: v.id, quantity: 1 }] },
      },
    });
  }
  console.log("Credit notes created");

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
