import { PrismaClient, Product } from "@prisma/client";
import { ProductInput } from "../validators/product.validator.js";

const prisma = new PrismaClient();

export class ProductRepository {
  /** Only return non-deleted products */
  async findAll(): Promise<Product[]> {
    return prisma.product.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: "desc" },
    });
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findFirst({
      where: { id, deleted_at: null },
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return prisma.product.findFirst({
      where: { sku, deleted_at: null },
    });
  }

  async create(data: ProductInput & { sku: string }): Promise<Product> {
    return prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description || null,
      },
    });
  }

  async update(id: string, data: Partial<ProductInput>): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description || undefined,
      },
    });
  }

  /** Soft delete — sets deleted_at, never removes the row */
  async delete(id: string): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
