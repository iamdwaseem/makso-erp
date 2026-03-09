import { PrismaClient, Variant } from "@prisma/client";
import { VariantInput } from "../validators/variant.validator.js";

const prisma = new PrismaClient();

export class VariantRepository {
  async findAll(): Promise<Variant[]> {
    return prisma.variant.findMany({
      include: { product: true },
      orderBy: { created_at: "desc" },
    });
  }

  async findById(id: string): Promise<Variant | null> {
    return prisma.variant.findUnique({
      where: { id },
    });
  }

  async findByProductId(productId: string): Promise<Variant[]> {
    return prisma.variant.findMany({
      where: { product_id: productId },
      orderBy: { created_at: "desc" },
    });
  }

  async findBySku(sku: string): Promise<Variant | null> {
    return prisma.variant.findUnique({
      where: { sku },
    });
  }

  async create(data: VariantInput): Promise<Variant> {
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

  async delete(id: string): Promise<Variant> {
    return prisma.variant.delete({
      where: { id },
    });
  }
}
