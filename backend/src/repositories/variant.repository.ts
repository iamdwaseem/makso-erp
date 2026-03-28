import { PrismaClient, Variant, Prisma } from "@prisma/client";
import { VariantInput } from "../validators/variant.validator.js";
import { BaseRepository } from "./BaseRepository.js";

export class VariantRepository extends BaseRepository {
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
      whereClause.OR = [
        { sku: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } }
      ];
    }
    
    return this.paginate<Variant>(
      (this.prisma as any).variant,
      this.tenantWhere(whereClause),
      page,
      limit,
      { product: true },
      { created_at: "desc" }
    );
  }

  async findById(id: string): Promise<Variant | null> {
    return (this.prisma as any).variant.findFirst({
      where: this.tenantWhere({ id, deleted_at: null }),
    });
  }

  async findByProductId(productId: string): Promise<Variant[]> {
    return (this.prisma as any).variant.findMany({
      where: this.tenantWhere({ product_id: productId, deleted_at: null }),
      orderBy: { created_at: "desc" },
    });
  }

  async findBySku(sku: string): Promise<Variant | null> {
    return (this.prisma as any).variant.findFirst({
      where: this.tenantWhere({ sku, deleted_at: null }),
      include: { product: true }
    });
  }

  async create(data: VariantInput & { sku: string }): Promise<Variant> {
    return (this.prisma as any).variant.create({
      data: this.tenantData({
        product_id: data.product_id,
        color: data.color,
        size: data.size ?? "",
        sku: data.sku,
      }),
    });
  }

  async update(id: string, data: Partial<VariantInput>): Promise<Variant> {
    return (this.prisma as any).variant.update({
      where: this.tenantWhere({ id }),
      data: {
        color: data.color || undefined,
        size: data.size !== undefined ? data.size : undefined,
        sku: data.sku || undefined,
      },
    });
  }

  async updateSku(id: string, sku: string): Promise<Variant> {
    return (this.prisma as any).variant.update({
      where: this.tenantWhere({ id }),
      data: { sku },
    });
  }

  /** Soft delete — preserves all linked ledger/sales/purchase history */
  async delete(id: string): Promise<Variant> {
    return (this.prisma as any).variant.update({
      where: this.tenantWhere({ id }),
      data: { deleted_at: new Date() },
    });
  }
}
