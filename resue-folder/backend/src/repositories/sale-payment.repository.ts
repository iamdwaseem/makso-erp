import { PrismaClient, Prisma } from "@prisma/client";
import { BaseRepository } from "./BaseRepository.js";

export class SalePaymentRepository extends BaseRepository {
  constructor(
    prisma: PrismaClient | Prisma.TransactionClient,
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    super(prisma, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async findBySaleId(saleId: string) {
    const sale = await (this.prisma as any).sale.findFirst({
      where: this.tenantWhere({ id: saleId }),
      select: { id: true },
    });
    if (!sale) return null;
    return (this.prisma as any).salePayment.findMany({
      where: { sale_id: saleId },
      orderBy: { paid_at: "desc" },
    });
  }

  async create(saleId: string, amount: number) {
    const sale = await (this.prisma as any).sale.findFirst({
      where: this.tenantWhere({ id: saleId }),
    });
    if (!sale) return null;
    return (this.prisma as any).salePayment.create({
      data: { sale_id: saleId, amount },
    });
  }

  async delete(saleId: string, paymentId: string) {
    const sale = await (this.prisma as any).sale.findFirst({
      where: this.tenantWhere({ id: saleId }),
    });
    if (!sale) return null;
    return (this.prisma as any).salePayment.deleteMany({
      where: { id: paymentId, sale_id: saleId },
    });
  }
}
