/**
 * Import scraped MAKSO products from CSV into inventory (Product + Variant per row).
 * Uses ProductService + VariantService; requires DATABASE_URL and optional IMPORT_ORGANIZATION_SLUG.
 *
 * Usage (from backend folder):
 *   npx tsx scripts/import-makso.ts [path/to/makso-products.csv]
 *
 * Default CSV path: scripts/makso-products.csv
 * Env: IMPORT_ORGANIZATION_SLUG (default: acme-erp)
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import prisma from "../src/lib/prisma.js";
import { ProductService } from "../src/services/product.service.js";
import { VariantService } from "../src/services/variant.service.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function parseCsvLine(line: string): string[] {
  return line.split(",").map((s) => s.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
}

async function main() {
  const csvPath = resolve(process.argv[2] || join(__dirname, "makso-products.csv"));
  const orgSlug = process.env.IMPORT_ORGANIZATION_SLUG || "acme-erp";

  const org = await (prisma as any).organization.findFirst({ where: { slug: orgSlug } });
  if (!org) {
    console.error(`Organization not found: ${orgSlug}. Set IMPORT_ORGANIZATION_SLUG or seed the DB.`);
    process.exit(1);
  }

  let csv: string;
  try {
    csv = readFileSync(csvPath, "utf8");
  } catch (e: any) {
    console.error(`Cannot read ${csvPath}:`, e?.message);
    process.exit(1);
  }

  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  const dataLines = lines.slice(1); // skip header
  const productService = new ProductService(org.id);
  const variantService = new VariantService(org.id);

  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const parts = parseCsvLine(line);
    const product_name = parts[0]?.trim();
    const category = parts[1]?.trim();
    const description = parts[2]?.trim();

    if (!product_name) continue;

    try {
      const product = await productService.createProduct({
        name: product_name,
        description: description || undefined,
      });
      await variantService.createVariant({
        product_id: product.id,
        color: category || "Default",
      });
      created++;
      console.log(`  + ${product_name} (${category || "Default"})`);
    } catch (e: any) {
      const msg = e?.message ?? "Unknown error";
      errors.push(`Row ${i + 2}: ${product_name} — ${msg}`);
    }
  }

  console.log(`\nCreated ${created} products with variants.`);
  if (errors.length > 0) {
    console.error("Errors:", errors);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
