import { PrismaClient, Product, Prisma } from "@prisma/client";
import { ProductInput } from "../validators/product.validator.js";
import { BaseRepository } from "./BaseRepository.js";

export class ProductRepository extends BaseRepository {
  constructor(
    prisma: PrismaClient | Prisma.TransactionClient, 
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    super(prisma, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async findAll({ page = 1, limit = 50, search }: { page?: number; limit?: number; search?: string } = {}) {
    const whereClause: any = { deleted_at: null };
    if (search) {
      whereClause.name = { contains: search, mode: "insensitive" };
    }
    
    return this.paginate<Product>(
      (this.prisma as any).product,
      this.tenantWhere(whereClause),
      page,
      limit,
      undefined,
      { created_at: "desc" }
    );
  }

  async findById(id: string): Promise<Product | null> {
    return (this.prisma as any).product.findFirst({
      where: this.tenantWhere({ id, deleted_at: null }),
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return (this.prisma as any).product.findFirst({
      where: this.tenantWhere({ sku, deleted_at: null }),
    });
  }

  async create(data: ProductInput & { sku: string }): Promise<Product> {
    return (this.prisma as any).product.create({
      data: this.tenantData({
        name: data.name,
        sku: data.sku,
        description: data.description || null,
      }),
    });
  }

  async update(id: string, data: Partial<ProductInput>): Promise<Product> {
    return (this.prisma as any).product.update({
      where: this.tenantWhere({ id }),
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description || undefined,
      },
    });
  }

  async updateSku(id: string, sku: string): Promise<Product> {
    return (this.prisma as any).product.update({
      where: this.tenantWhere({ id }),
      data: { sku },
    });
  }

  async delete(id: string): Promise<Product> {
    return (this.prisma as any).product.update({
      where: this.tenantWhere({ id }),
      data: { deleted_at: new Date() },
    });
  }
}
