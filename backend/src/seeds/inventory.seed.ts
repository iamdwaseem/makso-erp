/**
 * Inventory seed: loads the exact JSON dataset below.
 * Uses a dedicated org (slug "inventory-seed"). Each run replaces that org's
 * categories/products/variants/inventory with this exact data.
 * SKU format: CATEGORYCODE-XXXX (e.g. TMP-0001, AFR-0001).
 *
 * Run: npm run seed:inventory (from backend)
 */
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../../../.env") });

const prisma = new PrismaClient();

const SEED_ORG_SLUG = "inventory-seed";

// Exact dataset to load — do not modify product names or categories.
const seedData = {
  categories: [
    { name: "3M Products", products: ["3M Large Car Care Kit", "CARPET CLEANER", "Carpet Rug Protector", "N 95 Mask", "Scotch Bright Stainless Steel Spiral", "Scotch Brite Magic Sponge", "Scotch Brite Sponge Scourer", "Scrubbing Pad 17 And 20", "Stainless Steel Polish"] },
    { name: "Air Freshner", products: ["Air Freshener Concord", "Air Fresheners", "Air Fresheners Ocean Cool", "Shades Air Freshener"] },
    { name: "Bags", products: ["GARBAGE BAGS BLACK ALL SIZES BIO DEGRADABLE", "Garbage Bags White All Sizes Bio Degradable", "HAZARDOUS PLASTIC BAGS", "HYGIENE LINERS ALL SIZES BIO DEGRADABLE", "Ramadan Paper Bag"] },
    { name: "Branded Products", products: ["Ariel Washing Powder", "Clorox Bleach Spray", "Clorox Wipes", "DAC Drain Cleaner", "DAC Disinfectant", "Dettol 500 Ml 1 Litre 2 Litre 4 Litre", "Dettol All In One Antibacterial Spray", "Dettol All In One Antibacterial Wipes", "Dettol All In One Lemon Disinfectant 900ml", "Dettol Jasmine Home All Purpose", "Fairy Dishwashing Liquid", "Harpic Toilet Cleaner", "Jif Cream Cleaner 2in1 Anti-Bacterial", "Lux Dishwashing Liquid", "Medipal Disinfectant Wipes", "Pif Paf Insect Killer", "TAJ Detergent Gel"] },
    { name: "Chemicals", products: ["Carpet Powder", "Furniture Polish", "Tyre Polish"] },
    { name: "Cleaning Chemicals", products: ["ALL PURPOSE CLEANER", "ANTISEPTIC DISINFECTANT", "DISH WASH LEMON", "FLOOR CLEANER DISINFECTANT", "GLASS CLEANER 750 ML", "HAND SANITIZAR", "Hand Soap Liquid Rose", "HANDSOAP LIQUID LAVENDER"] },
    { name: "Cleaning Machines", products: ["Buffing Machines", "High Pressure Washer", "Portable Sanitizing Machine", "Portable Vacuum Machines", "Scrubbing Machines", "Vacuum Machines", "Walk Behind Scrubber Machine", "Wet And Dry Vacuum Machines"] },
    { name: "Cleaning Tools", products: ["Aluminum Handles Colour Coded", "Basin Brushes", "Coco Brushes", "Dust Control Airport Mops", "Dust Mop Frames", "Dust Pan With Brush", "Feather Duster", "Floor Wipers 35 45 55 60 70 CM", "Glass Scrapper Steel Plastic", "Glass Wiper 25 35 45 CM", "Hand Brushes", "Hard Brooms", "Kentucky Mop And Heads Qualite", "Kentucky Mop Colour Coded", "Kentucky Mop Full Color", "Lobby Dust Pan With Brush", "Lobby Dustpan And Broom Deluxe", "Metal Handles", "Microfiber Mops", "Mop Clip Colour Coded", "Mop Ringers", "Soft Brooms", "Street Brooms", "Toilet Brushes", "Toilet Brushes With Stand", "Toilet Plungers", "Vita Mops Qualite", "Wooden Handles"] },
    { name: "Dispensers", products: ["Auto Cut Tissue Dispenser", "Automatic Hand Dryer", "Automatic Hand Sanitizer Refill", "Hand Sanitizing Gel Dispensers Manual", "Mask Dispenser", "Maxi Roll Dispenser", "Maxi Roll Dispenser Nozzle Type", "Stainless Steel Soap Dispensers"] },
    { name: "Disposable Packing", products: ["Aluminium Foil", "Aluminum Containers", "Disposable Luxury Plastic Sofra", "Disposable Plastic Cups", "Disposable Plastic Plates", "Double Wall Cup", "Paper Cups", "Paper Plates", "Single Wall Cup"] },
    { name: "Disposable Products", products: ["Apron", "Disposable Cover-All", "Disposable Prayer Mat Quality", "Face Mask 3 Ply Adult", "Face Shield", "Gloves Latex Powder Free", "Gloves Nitrile Powder Free", "Gloves Vinyl Powder Free", "Hair Net", "Hand Sleeve", "Pe Gloves", "Shoe Cover Non Woven Pe"] },
    { name: "Garbage Bins", products: ["Bio Medical Bin All Sizes", "Plastic Bins All Sizes", "Steel Bins Pedal Type", "Steel Bins Pedal Type 50 L", "Steel Bins Pedal Type Qualite", "Steel Bins Swing"] },
    { name: "Hotel Supplies", products: ["Slippers Closed", "Tooth Pick", "Travel Bath Soap"] },
    { name: "Paper Products", products: ["Couch Roll", "FACIAL TISSUES", "Interfold Tissues", "MAXI ROLL", "MAXI ROLL 800 900 1000 GRM", "Napkin", "PRAYER MAT DISPOSABLE", "T Tork Tissue", "Toilet Seat Cover"] },
    { name: "Purell Products", products: ["Automatic Hand Sanitizer", "Automatic Hand Sanitizer Refill", "Automatic Soap Dispenser", "Automatic Soap Dispenser Refill", "Hand Sanitizer Desktop", "Hand Sanitizer Floor Stand Dispenser With Set", "Hand Sanitizing Wipes", "Jelly Wrapped Sanitizer", "Manual Soap Dispenser Refill", "PURELL Advanced Hand Sanitizer Gel 1000 mL Refill"] },
    { name: "Safety Items", products: ["Caution Sign Board", "Chemical Apron", "Chemical Cover-All", "Chemical Gloves", "Dewalt Safety Shoes", "First Aid Box", "Personal Protective Equipment", "PVC Boot Gumboots Safety Work Rain Boots", "Raincoat", "Safety Bag", "Safety Gloves", "Safety Goggles", "Safety Helmet", "Safety Jacket", "Safety Shoes"] },
    { name: "Towels & Sponge", products: ["Glass Cloth", "J Cloth Colour Coded", "Kitchen Towels Big", "Kitchen Towels Small", "Lone Sponge Yellow", "Magic Sponge", "Microfiber Towels Qualite", "Scourer Pad", "Scrubbing Pads", "Sponge Scourer", "Steel Wool Scrubber"] },
    { name: "Trolley and Buckets", products: ["Double Bucket Mop Trolley", "Double Bucket Trolley", "Housekeeping Service Trolley", "Luggage Cart", "Magic Mop And Bucket", "Multifunctional Service Cart With Door", "Pallet Truck 1 Ton And Above", "Platform Loading Trolley 150 300 500 600 Kg", "Single Bucket Trolley"] },
  ],
};

/** Category code: first letters of words (digits 3→T etc.), 3 chars. Uniquified if collision. */
function getCategoryCodes(categoryNames: string[]): Map<string, string> {
  const digitMap: Record<string, string> = { "1": "O", "2": "T", "3": "T", "4": "F", "5": "F", "6": "S", "7": "S", "8": "E", "9": "N", "0": "Z" };
  const used = new Set<string>();
  const result = new Map<string, string>();

  function rawCode(name: string): string {
    const words = name.trim().split(/\s+/).filter((w) => w !== "&" && w !== "and");
    let code = "";
    for (const word of words) {
      const first = (word[0] ?? "").toUpperCase();
      code += digitMap[first] ?? first;
      if (word.length > 1 && /^[0-9A-Za-z]/.test(word)) code += word[1].toUpperCase();
    }
    code = code.slice(0, 3);
    if (code.length === 2 && words[0]?.length > 1) code = code[0] + words[0][1].toUpperCase() + (code[1] ?? "");
    return (code.toUpperCase() || "XXX").slice(0, 3);
  }

  for (const name of categoryNames) {
    let code = rawCode(name);
    let suffix = 0;
    while (used.has(code)) {
      suffix++;
      code = (rawCode(name).slice(0, 2) + String(suffix)).slice(0, 3);
    }
    used.add(code);
    result.set(name, code);
  }
  return result;
}

/** Generate SKU: CATEGORYCODE-0001, 0002, ... */
function generateSku(categoryCode: string, index: number): string {
  return `${categoryCode}-${String(index).padStart(4, "0")}`;
}

async function getOrCreateSeedOrg(): Promise<{ id: string }> {
  let org = await prisma.organization.findUnique({ where: { slug: SEED_ORG_SLUG } });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "Inventory Seed", slug: SEED_ORG_SLUG },
    });
    console.log("Created organization:", org.name, `(${SEED_ORG_SLUG})`);
  }
  return { id: org.id };
}

async function getOrCreateWarehouse(organizationId: string): Promise<{ id: string }> {
  let wh = await prisma.warehouse.findFirst({ where: { organization_id: organizationId } });
  if (!wh) {
    wh = await prisma.warehouse.create({
      data: { organization_id: organizationId, name: "Main Warehouse", code: "MAIN-01", location: null },
    });
    console.log("Created warehouse:", wh.name);
  }
  return { id: wh.id };
}

/** Remove all categories, products, variants, inventory for this org so we can load exact data. */
async function clearOrgInventoryData(organizationId: string): Promise<void> {
  const variantIds = await prisma.variant.findMany({ where: { organization_id: organizationId }, select: { id: true } }).then((r) => r.map((x) => x.id));
  if (variantIds.length === 0) return;

  await (prisma as any).purchaseItem.deleteMany({ where: { variant_id: { in: variantIds } } });
  await (prisma as any).saleItem.deleteMany({ where: { variant_id: { in: variantIds } } });
  await (prisma as any).scanLog.deleteMany({ where: { variant_id: { in: variantIds } } });
  await prisma.inventory.deleteMany({ where: { organization_id: organizationId } });
  await (prisma as any).inventoryLedger.deleteMany({ where: { organization_id: organizationId } });
  await (prisma as any).inventorySummary.deleteMany({ where: { organization_id: organizationId } });
  await prisma.variant.deleteMany({ where: { organization_id: organizationId } });
  await prisma.product.deleteMany({ where: { organization_id: organizationId } });
  await prisma.category.deleteMany({ where: { organization_id: organizationId } });
  console.log("Cleared existing inventory data for this org.");
}

async function main() {
  console.log("Inventory seed — loading exact dataset into org", SEED_ORG_SLUG, "\n");

  const { id: organizationId } = await getOrCreateSeedOrg();
  const { id: warehouseId } = await getOrCreateWarehouse(organizationId);

  await clearOrgInventoryData(organizationId);

  const categoryCodeMap = getCategoryCodes(seedData.categories.map((c) => c.name));
  let categoriesCreated = 0;
  let productsCreated = 0;
  let variantsCreated = 0;
  let inventoryCreated = 0;

  for (const cat of seedData.categories) {
    const categoryCode = categoryCodeMap.get(cat.name) ?? "XXX";
    const category = await prisma.category.create({
      data: { organization_id: organizationId, name: cat.name },
    });
    categoriesCreated++;

    let productIndex = 0;
    for (const productName of cat.products) {
      productIndex++;
      const sku = generateSku(categoryCode, productIndex);
      const product = await prisma.product.create({
        data: {
          organization_id: organizationId,
          category_id: category.id,
          name: productName,
          sku,
        },
      });
      productsCreated++;

      const variant = await prisma.variant.create({
        data: {
          organization_id: organizationId,
          product_id: product.id,
          sku: product.sku,
          color: "Default",
        },
      });
      variantsCreated++;

      await prisma.inventory.create({
        data: {
          organization_id: organizationId,
          variant_id: variant.id,
          warehouse_id: warehouseId,
          quantity: 0,
        },
      });
      inventoryCreated++;
    }
  }

  console.log("\nDone. Exact dataset loaded.");
  console.log("  Categories:", categoriesCreated);
  console.log("  Products:", productsCreated);
  console.log("  Variants:", variantsCreated);
  console.log("  Inventory rows:", inventoryCreated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
