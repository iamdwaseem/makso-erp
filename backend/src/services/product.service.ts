import { PrismaClient } from "@prisma/client";
import { ProductRepository } from "../repositories/product.repository.js";
import { ProductInput } from "../validators/product.validator.js";

import prisma from "../lib/prisma.js";
import { VariantRepository } from "../repositories/variant.repository.js";

/**
 * Generate a base SKU from a product name.
 */
async function generateProductSku(name: string, organizationId: string): Promise<string> {
  const asciiName = name.replace(/[^\x20-\x7E]/g, "").trim();
  const initials = (asciiName || "PRD")
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .join("");

  const base = initials || "PRD";

  const existing = await (prisma as any).product.findMany({
    where: { 
      organization_id: organizationId,
      sku: { startsWith: base } 
    },
    select: { sku: true },
  });

  let counter = 1;
  const usedNumbers = new Set(
    existing.map((p: any) => {
      const match = p.sku.match(/-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
  );
  while (usedNumbers.has(counter)) counter++;

  return `${base}-${String(counter).padStart(3, "0")}`;
}

export class ProductService {
  private productRepository: ProductRepository;
  private variantRepository: VariantRepository;
  private organizationId: string;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    this.organizationId = organizationId;
    this.productRepository = new ProductRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
    this.variantRepository = new VariantRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAllProducts(opts?: { page?: number; limit?: number; search?: string }) {
    return this.productRepository.findAll(opts);
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new Error("Product not found");
    return product;
  }

  async createProduct(data: ProductInput) {
    const sku = data.sku?.trim() || (await generateProductSku(data.name, this.organizationId));

    const existingSku = await this.productRepository.findBySku(sku);
    if (existingSku) throw new Error("SKU already exists");

    return this.productRepository.create({ ...data, sku });
  }

  async updateProduct(id: string, data: Partial<ProductInput>) {
    const product = await this.getProductById(id);

    if (data.sku && data.sku !== product.sku) {
      const existingSku = await this.productRepository.findBySku(data.sku);
      if (existingSku) throw new Error("SKU already exists");
    }

    return this.productRepository.update(id, data);
  }

  async deleteProduct(id: string) {
    await this.getProductById(id);

    // Prevent deleting a product that still has live stock in the warehouse.
    const liveVariants = await this.variantRepository.findByProductId(id);
    const variantIds = liveVariants.map(v => v.id);

    const activeInventory = await (prisma as any).inventory.findMany({
      where: {
        organization_id: this.organizationId,
        variant_id: { in: variantIds },
        quantity: { gt: 0 },
      },
    });

    if (activeInventory.length > 0) {
      const totalUnits = activeInventory.reduce((sum: number, i: any) => sum + i.quantity, 0);
      throw new Error(
        `Cannot delete: product still has ${totalUnits} unit(s) in stock across ` +
        `${activeInventory.length} variant(s). ` +
        `Transfer or write-off the stock before deleting.`
      );
    }

    return this.productRepository.delete(id);
  }
}
