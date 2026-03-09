import { PrismaClient, Product } from "@prisma/client";
import { ProductInput } from "../validators/product.validator.js";

const prisma = new PrismaClient();

export class ProductRepository {
  async findAll(): Promise<Product[]> {
    return prisma.product.findMany({
      orderBy: { created_at: "desc" },
    });
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { sku },
    });
  }

  async create(data: ProductInput): Promise<Product> {
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

  async delete(id: string): Promise<Product> {
    return prisma.product.delete({
      where: { id },
    });
  }
}
