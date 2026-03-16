import { PrismaClient, Prisma } from "@prisma/client";
import { BaseRepository } from "./BaseRepository.js";

export class AdjustmentRepository extends BaseRepository {
  constructor(
    prisma: PrismaClient | Prisma.TransactionClient,
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    super(prisma, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async findAll(opts: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 50 } = opts;
    return this.paginate(
      (this.prisma as any).adjustment,
      this.warehouseWhere({}),
      page,
      limit,
      { warehouse: true, variant: { include: { product: true } } },
      { created_at: "desc" }
    );
  }

  async findById(id: string) {
    return (this.prisma as any).adjustment.findFirst({
      where: this.tenantWhere({ id }),
      include: { warehouse: true, variant: { include: { product: true } } },
    });
  }
}
