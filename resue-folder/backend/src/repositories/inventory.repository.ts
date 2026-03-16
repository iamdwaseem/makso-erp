import { PrismaClient, Prisma } from "@prisma/client";
import { BaseRepository } from "./BaseRepository.js";

type InventoryRecord = {
  id: string;
  organization_id: string;
  variant_id: string;
  warehouse_id: string;
  quantity: number;
  reserved: number;
  updated_at: Date;
};

export class InventoryRepository extends BaseRepository {
  constructor(
    prisma: PrismaClient | Prisma.TransactionClient,
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    super(prisma, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async findAll(opts: {
    page?: number;
    limit?: number;
    search?: string;
    productId?: string;
    warehouseId?: string;
  } = {}) {
    const { page = 1, limit = 50, search, productId, warehouseId } = opts;
    const where: any = this.tenantWhere({});
    if (warehouseId && warehouseId !== "all") {
      where.warehouse_id = warehouseId;
    }
    if (productId && productId !== "all") {
      where.variant = { product_id: productId };
    }
    if (search && search.trim().length >= 2) {
      where.OR = [
        { variant: { sku: { contains: search.trim(), mode: "insensitive" } } },
        { variant: { product: { name: { contains: search.trim(), mode: "insensitive" } } } },
      ];
    }
    const wWhere = this.userRole === "ADMIN" ? where : { ...where, warehouse_id: { in: this.allowedWarehouseIds } };
    return this.paginate<InventoryRecord>(
      (this.prisma as any).inventory,
      wWhere,
      page,
      limit,
      { variant: { include: { product: true } }, warehouse: true },
      { variant: { product: { name: "asc" } } }
    );
  }

  async findByVariantId(variantId: string, warehouseId?: string): Promise<InventoryRecord | null> {
    const where: any = this.tenantWhere({ variant_id: variantId });
    if (warehouseId) where.warehouse_id = warehouseId;
    return (this.prisma as any).inventory.findFirst({
      where,
      include: { variant: { include: { product: true } }, warehouse: true },
    });
  }

  async getLedgerByVariantId(variantId: string, warehouseId?: string) {
    const where: any = this.tenantWhere({ variant_id: variantId });
    if (warehouseId) where.warehouse_id = warehouseId;
    return (this.prisma as any).inventoryLedger.findMany({
      where,
      include: { warehouse: true },
      orderBy: { created_at: "desc" },
    });
  }

  /** Apply quantity delta, upsert inventory row, insert ledger. Run inside caller's tx if provided. */
  async applyStockChange(
    params: {
      variant_id: string;
      warehouse_id: string;
      quantity_delta: number;
      type: string;
      reference_id?: string;
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = (tx ?? this.prisma) as any;
    const where = this.tenantWhere({
      variant_id: params.variant_id,
      warehouse_id: params.warehouse_id,
    });

    const existing = await client.inventory.findFirst({ where });

    const newQuantity = (existing?.quantity ?? 0) + params.quantity_delta;
    if (newQuantity < 0) {
      throw new Error("Insufficient inventory");
    }

    if (existing) {
      await client.inventory.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
      });
    } else {
      await client.inventory.create({
        data: this.tenantData({
          variant_id: params.variant_id,
          warehouse_id: params.warehouse_id,
          quantity: newQuantity,
          reserved: 0,
        }),
      });
    }

    await client.inventoryLedger.create({
      data: {
        ...this.tenantData({
          variant_id: params.variant_id,
          warehouse_id: params.warehouse_id,
          quantity: Math.abs(params.quantity_delta),
          type: params.type,
          reference_id: params.reference_id ?? null,
        }),
      },
    });

    return (await client.inventory.findFirst({
      where,
      include: { variant: true, warehouse: true },
    })) as InventoryRecord;
  }
}
