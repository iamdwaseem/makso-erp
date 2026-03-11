import { PrismaClient, Supplier, Prisma } from "@prisma/client";
import { SupplierInput } from "../validators/supplier.validator.js";
import { BaseRepository } from "./BaseRepository.js";

export class SupplierRepository extends BaseRepository {
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
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } }
      ];
    }
    return this.paginate<Supplier>(
      (this.prisma as any).supplier,
      this.tenantWhere(whereClause),
      page,
      limit,
      undefined,
      { created_at: "desc" }
    );
  }

  async findById(id: string): Promise<Supplier | null> {
    return (this.prisma as any).supplier.findFirst({
      where: this.tenantWhere({ id }),
    });
  }

  async create(data: SupplierInput): Promise<Supplier> {
    return (this.prisma as any).supplier.create({
      data: this.tenantData({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
      }),
    });
  }

  async update(id: string, data: Partial<SupplierInput>): Promise<Supplier> {
    return (this.prisma as any).supplier.update({
      where: this.tenantWhere({ id }),
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address || undefined,
      },
    });
  }

  async delete(id: string): Promise<Supplier> {
    return (this.prisma as any).supplier.delete({
      where: this.tenantWhere({ id }),
    });
  }
}
