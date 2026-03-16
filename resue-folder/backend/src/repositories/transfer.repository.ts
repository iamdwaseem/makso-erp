import { PrismaClient, Prisma } from "@prisma/client";
import { CreateTransferInput, UpdateTransferInput } from "../validators/transfer.validator.js";
import { BaseRepository } from "./BaseRepository.js";

export class TransferRepository extends BaseRepository {
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
    const where = this.tenantWhere({});
    return this.paginate(
      (this.prisma as any).transfer,
      where,
      page,
      limit,
      {
        source_warehouse: true,
        target_warehouse: true,
        items: { include: { variant: { include: { product: true } } } },
      },
      { created_at: "desc" }
    );
  }

  async findById(id: string) {
    return (this.prisma as any).transfer.findFirst({
      where: this.tenantWhere({ id }),
      include: {
        source_warehouse: true,
        target_warehouse: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });
  }

  async create(data: CreateTransferInput) {
    const { items, ...header } = data;
    const transfer = await (this.prisma as any).transfer.create({
      data: this.tenantData({
        source_warehouse_id: header.source_warehouse_id,
        target_warehouse_id: header.target_warehouse_id,
        status: "DRAFT",
      }),
    });
    for (const item of items) {
      await (this.prisma as any).transferItem.create({
        data: {
          transfer_id: transfer.id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        },
      });
    }
    return this.findById(transfer.id);
  }

  async update(id: string, data: UpdateTransferInput) {
    const existing = await (this.prisma as any).transfer.findFirst({
      where: this.tenantWhere({ id }),
    });
    if (!existing || existing.status !== "DRAFT") return null;
    if (data.items != null) {
      await (this.prisma as any).transferItem.deleteMany({ where: { transfer_id: id } });
      for (const item of data.items) {
        await (this.prisma as any).transferItem.create({
          data: { transfer_id: id, variant_id: item.variant_id, quantity: item.quantity },
        });
      }
    }
    return this.findById(id);
  }

  async updateStatus(id: string, status: string) {
    await (this.prisma as any).transfer.update({
      where: { id },
      data: { status },
    });
  }
}
