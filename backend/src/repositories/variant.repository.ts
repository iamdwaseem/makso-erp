import { PrismaClient, Variant } from "@prisma/client";
import { VariantInput } from "../validators/variant.validator.js";

const prisma = new PrismaClient();

export class VariantRepository {
  async findAll(): Promise<Variant[]> {
    return prisma.variant.findMany({
      where: { deleted_at: null },
      include: { product: true },
      orderBy: { created_at: "desc" },
    });
  }

  async findById(id: string): Promise<Variant | null> {
    return prisma.variant.findFirst({
      where: { id, deleted_at: null },
    });
  }

  async findByProductId(productId: string): Promise<Variant[]> {
    return prisma.variant.findMany({
      where: { product_id: productId, deleted_at: null },
      orderBy: { created_at: "desc" },
    });
  }

  async findBySku(sku: string): Promise<Variant | null> {
    return prisma.variant.findFirst({
      where: { sku, deleted_at: null },
    });
  }

  async create(data: VariantInput & { sku: string }): Promise<Variant> {
    return prisma.variant.create({
      data: {
        product_id: data.product_id,
        color: data.color,
        sku: data.sku,
      },
    });
  }

  async update(id: string, data: Partial<VariantInput>): Promise<Variant> {
    return prisma.variant.update({
      where: { id },
      data: {
        color: data.color || undefined,
        sku: data.sku || undefined,
      },
    });
  }

  /** Soft delete — preserves all linked ledger/sales/purchase history */
  async delete(id: string): Promise<Variant> {
    return prisma.variant.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
