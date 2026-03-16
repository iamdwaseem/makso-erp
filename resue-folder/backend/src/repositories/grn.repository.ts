import { PrismaClient, Prisma } from "@prisma/client";
import { CreateGrnInput, UpdateGrnInput } from "../validators/grn.validator.js";
import { BaseRepository } from "./BaseRepository.js";

export class GrnRepository extends BaseRepository {
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
      (this.prisma as any).grn,
      this.warehouseWhere({}),
      page,
      limit,
      {
        warehouse: true,
        supplier: true,
        items: { include: { variant: { include: { product: true } } } },
      },
      { created_at: "desc" }
    );
  }

  async findById(id: string) {
    return (this.prisma as any).grn.findFirst({
      where: this.tenantWhere({ id }),
      include: {
        warehouse: true,
        supplier: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });
  }

  async create(data: CreateGrnInput) {
    const { items, ...header } = data;
    const grn = await (this.prisma as any).grn.create({
      data: this.tenantData({
        warehouse_id: header.warehouse_id,
        supplier_id: header.supplier_id ?? null,
        status: "DRAFT",
      }),
    });
    for (const item of items) {
      await (this.prisma as any).grnItem.create({
        data: { grn_id: grn.id, variant_id: item.variant_id, quantity: item.quantity },
      });
    }
    return this.findById(grn.id);
  }

  async update(id: string, data: UpdateGrnInput) {
    const existing = await (this.prisma as any).grn.findFirst({
      where: this.tenantWhere({ id }),
    });
    if (!existing || existing.status !== "DRAFT") return null;
    const { items, ...header } = data;
    const updatePayload: any = {};
    if (header.warehouse_id != null) updatePayload.warehouse_id = header.warehouse_id;
    if (header.supplier_id !== undefined) updatePayload.supplier_id = header.supplier_id ?? null;
    if (Object.keys(updatePayload).length > 0) {
      await (this.prisma as any).grn.update({ where: { id }, data: updatePayload });
    }
    if (items != null) {
      await (this.prisma as any).grnItem.deleteMany({ where: { grn_id: id } });
      for (const item of items) {
        await (this.prisma as any).grnItem.create({
          data: { grn_id: id, variant_id: item.variant_id, quantity: item.quantity },
        });
      }
    }
    return this.findById(id);
  }

  async updateStatus(id: string, status: string) {
    await (this.prisma as any).grn.update({
      where: { id },
      data: { status },
    });
  }
}
