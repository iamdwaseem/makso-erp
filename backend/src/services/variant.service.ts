import { VariantRepository } from "../repositories/variant.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { VariantInput } from "../validators/variant.validator.js";
import prisma from "../lib/prisma.js";

/**
 * Generate a variant SKU from the product's base SKU + colour initials.
 */
async function generateVariantSku(productId: string, color: string, organizationId: string): Promise<string> {
  const productRepo = new ProductRepository(prisma as any, organizationId);
  const product = await productRepo.findById(productId);
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
  const existing = await (prisma as any).variant.findMany({
    where: { 
      organization_id: organizationId,
      sku: { startsWith: candidate } 
    },
    select: { sku: true },
  });

  if (existing.length === 0) return candidate;

  const usedNumbers = new Set(
    existing.map((v: any) => {
      const match = v.sku.replace(candidate, "").match(/^-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
  );

  let counter = 2;
  while (usedNumbers.has(counter)) counter++;
  return `${candidate}-${counter}`;
}

export class VariantService {
  private variantRepository: VariantRepository;
  private productRepository: ProductRepository;
  private organizationId: string;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    this.organizationId = organizationId;
    this.variantRepository = new VariantRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
    this.productRepository = new ProductRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAllVariants(opts?: { page?: number; limit?: number; search?: string }) {
    return this.variantRepository.findAll(opts);
  }

  async getVariantById(id: string) {
    const variant = await this.variantRepository.findById(id);
    if (!variant) throw new Error("Variant not found");
    return variant;
  }

  async getVariantsByProductId(productId: string) {
    return this.variantRepository.findByProductId(productId);
  }

  async getVariantBySku(sku: string) {
    const variant = await this.variantRepository.findBySku(sku);
    if (!variant) throw new Error("Variant not found");
    return variant;
  }

  async createVariant(data: VariantInput) {
    const sku = data.sku?.trim() || (await generateVariantSku(data.product_id, data.color, this.organizationId));

    const existingSku = await this.variantRepository.findBySku(sku);
    if (existingSku) throw new Error("SKU already exists");

    return this.variantRepository.create({ ...data, sku });
  }

  async updateVariant(id: string, data: Partial<VariantInput>) {
    const variant = await this.getVariantById(id);

    if (data.sku && data.sku !== variant.sku) {
      const existingSku = await this.variantRepository.findBySku(data.sku);
      if (existingSku) throw new Error("SKU already exists");
    }

    return this.variantRepository.update(id, data);
  }

  async deleteVariant(id: string) {
    await this.getVariantById(id);

    // SQL RLS handles the organization filter, but we explicitly check here for extra safety
    const inventory = await (prisma as any).inventory.findFirst({
      where: { 
        organization_id: this.organizationId,
        variant_id: id,
        quantity: { gt: 0 }
      },
    });

    if (inventory) {
      throw new Error(
        `Cannot delete: variant still has ${inventory.quantity} unit(s) in stock. ` +
        `Write off or transfer the stock before deleting.`
      );
    }

    return this.variantRepository.delete(id);
  }
}
