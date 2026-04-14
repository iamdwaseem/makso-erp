import { PrismaClient, Warehouse, Prisma } from "@prisma/client";
import { BaseRepository } from "./BaseRepository.js";

export class WarehouseRepository extends BaseRepository {
  constructor(
    prisma: PrismaClient | Prisma.TransactionClient, 
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    super(prisma, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async findAll({ page = 1, limit = 50 }: { page?: number; limit?: number } = {}) {
    let where: any = this.tenantWhere({});
    if (this.userRole !== "ADMIN") {
      where = { ...where, id: { in: this.allowedWarehouseIds } };
    }

    return this.paginate<Warehouse>(
      (this.prisma as any).warehouse,
      where,
      page,
      limit,
      undefined,
      { created_at: "desc" }
    );
  }

  async findById(id: string): Promise<Warehouse | null> {
    return (this.prisma as any).warehouse.findFirst({
      where: this.tenantWhere({ id }),
    });
  }

  async create(data: { name: string; code: string; location?: string; phone?: string }): Promise<Warehouse> {
    return (this.prisma as any).warehouse.create({
      data: this.tenantData({
        name: data.name,
        code: data.code,
        location: data.location || null,
        phone: data.phone || null,
      }),
    });
  }

  async update(id: string, data: Partial<{ name: string; code: string; location: string; phone: string }>): Promise<Warehouse> {
    return (this.prisma as any).warehouse.update({
      where: this.tenantWhere({ id }),
      data: {
        name: data.name,
        code: data.code,
        location: data.location,
        phone: data.phone,
      },
    });
  }

  async delete(id: string): Promise<Warehouse> {
    return (this.prisma as any).warehouse.delete({
      where: this.tenantWhere({ id }),
    });
  }
}
