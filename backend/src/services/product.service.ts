import { PrismaClient } from "@prisma/client";
import { ProductRepository } from "../repositories/product.repository.js";
import { ProductInput } from "../validators/product.validator.js";

const productRepository = new ProductRepository();
const prisma = new PrismaClient();

/**
 * Generate a base SKU from a product name.
 * "Michael Kors Bag" → "MKB"
 * Appends a zero-padded counter to guarantee uniqueness, e.g. "MKB-001", "MKB-002"
 */
async function generateProductSku(name: string): Promise<string> {
  // Strip non-ASCII characters (emoji, symbols) before extracting initials
  const asciiName = name.replace(/[^\x20-\x7E]/g, "").trim();

  const initials = (asciiName || "PRD")
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .join("");

  const base = initials || "PRD";

  // Find how many products already start with this prefix
  const existing = await prisma.product.findMany({
    where: { sku: { startsWith: base } },
    select: { sku: true },
  });

  let counter = 1;
  const usedNumbers = new Set(
    existing.map(p => {
      const match = p.sku.match(/-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
  );
  while (usedNumbers.has(counter)) counter++;

  return `${base}-${String(counter).padStart(3, "0")}`;
}

export class ProductService {
  async getAllProducts() {
    return productRepository.findAll();
  }

  async getProductById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) throw new Error("Product not found");
    return product;
  }

  async createProduct(data: ProductInput) {
    // Auto-generate SKU if not provided
    const sku = data.sku?.trim() || (await generateProductSku(data.name));

    const existingSku = await productRepository.findBySku(sku);
    if (existingSku) throw new Error("SKU already exists");

    return productRepository.create({ ...data, sku });
  }

  async updateProduct(id: string, data: Partial<ProductInput>) {
    const product = await this.getProductById(id);

    if (data.sku && data.sku !== product.sku) {
      const existingSku = await productRepository.findBySku(data.sku);
      if (existingSku) throw new Error("SKU already exists");
    }

    return productRepository.update(id, data);
  }

  async deleteProduct(id: string) {
    await this.getProductById(id);

    // ── Zero Inventory Guard ─────────────────────────────────────────────
    // Prevent deleting a product that still has live stock in the warehouse.
    // Ghost stock (exists physically but invisible on dashboard) is a data
    // integrity violation that can corrupt stocktake reports.
    const liveVariants = await prisma.variant.findMany({
      where: { product_id: id, deleted_at: null },
      select: { id: true },
    });

    const activeInventory = await prisma.inventory.findMany({
      where: {
        variant_id: { in: liveVariants.map(v => v.id) },
        quantity: { gt: 0 },
      },
    });

    if (activeInventory.length > 0) {
      const totalUnits = activeInventory.reduce((sum, i) => sum + i.quantity, 0);
      throw new Error(
        `Cannot delete: product still has ${totalUnits} unit(s) in stock across ` +
        `${activeInventory.length} variant(s). ` +
        `Transfer or write-off the stock before deleting.`
      );
    }

    return productRepository.delete(id);
  }
}
