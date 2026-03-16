import { PrismaClient, Prisma } from "@prisma/client";
import { CreateGdnInput, UpdateGdnInput } from "../validators/gdn.validator.js";
import { BaseRepository } from "./BaseRepository.js";

export class GdnRepository extends BaseRepository {
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
      (this.prisma as any).gdn,
      this.warehouseWhere({}),
      page,
      limit,
      {
        warehouse: true,
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
      },
      { created_at: "desc" }
    );
  }

  async findById(id: string) {
    return (this.prisma as any).gdn.findFirst({
      where: this.tenantWhere({ id }),
      include: {
        warehouse: true,
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });
  }

  async create(data: CreateGdnInput) {
    const { items, ...header } = data;
    const gdn = await (this.prisma as any).gdn.create({
      data: this.tenantData({
        warehouse_id: header.warehouse_id,
        customer_id: header.customer_id ?? null,
        status: "DRAFT",
      }),
    });
    for (const item of items) {
      await (this.prisma as any).gdnItem.create({
        data: { gdn_id: gdn.id, variant_id: item.variant_id, quantity: item.quantity },
      });
    }
    return this.findById(gdn.id);
  }

  async update(id: string, data: UpdateGdnInput) {
    const existing = await (this.prisma as any).gdn.findFirst({
      where: this.tenantWhere({ id }),
    });
    if (!existing || existing.status !== "DRAFT") return null;
    const { items, ...header } = data;
    const updatePayload: any = {};
    if (header.warehouse_id != null) updatePayload.warehouse_id = header.warehouse_id;
    if (header.customer_id !== undefined) updatePayload.customer_id = header.customer_id ?? null;
    if (Object.keys(updatePayload).length > 0) {
      await (this.prisma as any).gdn.update({ where: { id }, data: updatePayload });
    }
    if (items != null) {
      await (this.prisma as any).gdnItem.deleteMany({ where: { gdn_id: id } });
      for (const item of items) {
        await (this.prisma as any).gdnItem.create({
          data: { gdn_id: id, variant_id: item.variant_id, quantity: item.quantity },
        });
      }
    }
    return this.findById(id);
  }

  async updateStatus(id: string, status: string) {
    await (this.prisma as any).gdn.update({
      where: { id },
      data: { status },
    });
  }
}
