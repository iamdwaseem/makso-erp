import { PrismaClient, Prisma } from "@prisma/client";
import { CreateSaleInput, UpdateSaleInput } from "../validators/sale.validator.js";
import { BaseRepository } from "./BaseRepository.js";

export class SaleRepository extends BaseRepository {
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
      (this.prisma as any).sale,
      this.warehouseWhere({}),
      page,
      limit,
      {
        customer: true,
        warehouse: true,
        items: { include: { variant: { include: { product: true } } } },
        payments: true,
      },
      { created_at: "desc" }
    );
  }

  async findById(id: string) {
    return (this.prisma as any).sale.findFirst({
      where: this.tenantWhere({ id }),
      include: {
        customer: true,
        warehouse: true,
        items: { include: { variant: { include: { product: true } } } },
        payments: true,
      },
    });
  }

  async create(data: CreateSaleInput) {
    const { items, ...header } = data;
    const total_amount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    const sale = await (this.prisma as any).sale.create({
      data: this.tenantData({
        customer_id: header.customer_id,
        warehouse_id: header.warehouse_id,
        status: "DRAFT",
        total_amount,
      }),
    });
    for (const item of items) {
      await (this.prisma as any).saleItem.create({
        data: {
          sale_id: sale.id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price,
        },
      });
    }
    return this.findById(sale.id);
  }

  async update(id: string, data: UpdateSaleInput) {
    const existing = await (this.prisma as any).sale.findFirst({
      where: this.tenantWhere({ id }),
    });
    if (!existing || existing.status !== "DRAFT") return null;
    const { items, ...header } = data;
    const updatePayload: any = { };
    if (header.customer_id != null) updatePayload.customer_id = header.customer_id;
    if (header.warehouse_id != null) updatePayload.warehouse_id = header.warehouse_id;
    if (items != null) {
      const total_amount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
      updatePayload.total_amount = total_amount;
      await (this.prisma as any).saleItem.deleteMany({ where: { sale_id: id } });
      for (const item of items) {
        await (this.prisma as any).saleItem.create({
          data: {
            sale_id: id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: item.price,
          },
        });
      }
    }
    if (Object.keys(updatePayload).length > 0) {
      await (this.prisma as any).sale.update({ where: { id }, data: updatePayload });
    }
    return this.findById(id);
  }

  async updateStatus(id: string, status: string) {
    await (this.prisma as any).sale.update({
      where: { id },
      data: { status },
    });
  }
}
