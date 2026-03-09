import { PrismaClient } from "@prisma/client";
import { VariantRepository } from "../repositories/variant.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { VariantInput } from "../validators/variant.validator.js";

const variantRepository = new VariantRepository();
const productRepository = new ProductRepository();
const prisma = new PrismaClient();

/**
 * Generate a variant SKU from the product's base SKU + colour initials.
 * Product SKU "MKB-001" + color "Midnight Black" → "MKB-001-MB"
 * Falls back to first 3 chars of colour if single word: "Red" → "MKB-001-RED"
 * Appends counter if there's a collision: "MKB-001-RED-2"
 */
async function generateVariantSku(productId: string, color: string): Promise<string> {
  const product = await productRepository.findById(productId);
  const baseSku = product?.sku ?? "PRD-001";

  const colourCode = color
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .join("");

  const colorPart = colourCode.length > 0 ? colourCode : color.substring(0, 3).toUpperCase();
  const candidate = `${baseSku}-${colorPart}`;

  // Check for collision and increment
  const existing = await prisma.variant.findMany({
    where: { sku: { startsWith: candidate } },
    select: { sku: true },
  });

  if (existing.length === 0) return candidate;

  const usedNumbers = new Set(
    existing.map(v => {
      const match = v.sku.replace(candidate, "").match(/^-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
  );

  let counter = 2;
  while (usedNumbers.has(counter)) counter++;
  return `${candidate}-${counter}`;
}

export class VariantService {
  async getAllVariants() {
    return variantRepository.findAll();
  }

  async getVariantById(id: string) {
    const variant = await variantRepository.findById(id);
    if (!variant) throw new Error("Variant not found");
    return variant;
  }

  async getVariantsByProductId(productId: string) {
    return variantRepository.findByProductId(productId);
  }

  async createVariant(data: VariantInput) {
    // Auto-generate SKU if not provided
    const sku = data.sku?.trim() || (await generateVariantSku(data.product_id, data.color));

    const existingSku = await variantRepository.findBySku(sku);
    if (existingSku) throw new Error("SKU already exists");

    return variantRepository.create({ ...data, sku });
  }

  async updateVariant(id: string, data: Partial<VariantInput>) {
    const variant = await this.getVariantById(id);

    if (data.sku && data.sku !== variant.sku) {
      const existingSku = await variantRepository.findBySku(data.sku);
      if (existingSku) throw new Error("SKU already exists");
    }

    return variantRepository.update(id, data);
  }

  async deleteVariant(id: string) {
    await this.getVariantById(id);

    // ── Zero Inventory Guard ─────────────────────────────────────────────
    const inventory = await prisma.inventory.findUnique({
      where: { variant_id: id },
    });

    if (inventory && inventory.quantity > 0) {
      throw new Error(
        `Cannot delete: variant still has ${inventory.quantity} unit(s) in stock. ` +
        `Write off or transfer the stock before deleting.`
      );
    }

    return variantRepository.delete(id);
  }
}
