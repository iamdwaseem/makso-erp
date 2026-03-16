import { PrismaClient, Prisma } from "@prisma/client";
import { CreatePurchaseInput, UpdatePurchaseInput } from "../validators/purchase.validator.js";
import { BaseRepository } from "./BaseRepository.js";

export class PurchaseRepository extends BaseRepository {
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
      (this.prisma as any).purchase,
      this.warehouseWhere({}),
      page,
      limit,
      {
        supplier: true,
        warehouse: true,
        items: { include: { variant: { include: { product: true } } } },
      },
      { created_at: "desc" }
    );
  }

  async findById(id: string) {
    return (this.prisma as any).purchase.findFirst({
      where: this.tenantWhere({ id }),
      include: {
        supplier: true,
        warehouse: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });
  }

  async create(data: CreatePurchaseInput) {
    const { items, ...header } = data;
    const total_amount = items.reduce((sum, i) => sum + i.quantity * i.cost, 0);
    const purchase = await (this.prisma as any).purchase.create({
      data: this.tenantData({
        supplier_id: header.supplier_id,
        warehouse_id: header.warehouse_id,
        status: "DRAFT",
        total_amount,
      }),
    });
    for (const item of items) {
      await (this.prisma as any).purchaseItem.create({
        data: {
          purchase_id: purchase.id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          cost: item.cost,
        },
      });
    }
    return this.findById(purchase.id);
  }

  async update(id: string, data: UpdatePurchaseInput) {
    const existing = await (this.prisma as any).purchase.findFirst({
      where: this.tenantWhere({ id }),
    });
    if (!existing || existing.status !== "DRAFT") return null;
    const { items, ...header } = data;
    const updatePayload: any = {};
    if (header.supplier_id != null) updatePayload.supplier_id = header.supplier_id;
    if (header.warehouse_id != null) updatePayload.warehouse_id = header.warehouse_id;
    if (items != null) {
      const total_amount = items.reduce((sum, i) => sum + i.quantity * i.cost, 0);
      updatePayload.total_amount = total_amount;
      await (this.prisma as any).purchaseItem.deleteMany({ where: { purchase_id: id } });
      for (const item of items) {
        await (this.prisma as any).purchaseItem.create({
          data: {
            purchase_id: id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            cost: item.cost,
          },
        });
      }
    }
    if (Object.keys(updatePayload).length > 0) {
      await (this.prisma as any).purchase.update({ where: { id }, data: updatePayload });
    }
    return this.findById(id);
  }

  async updateStatus(id: string, status: string) {
    await (this.prisma as any).purchase.update({
      where: { id },
      data: { status },
    });
  }
}
