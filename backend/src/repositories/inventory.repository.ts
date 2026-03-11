import { Inventory, InventoryLedger, LedgerAction, PrismaClient, Prisma } from "@prisma/client";
import { AdjustInventoryInput } from "../validators/inventory.validator.js";
import { BaseRepository } from "./BaseRepository.js";

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

  async findAll({ 
    page = 1, 
    limit = 50,
    search,
    productId,
    status,
    warehouseId
  }: { 
    page?: number; 
    limit?: number;
    search?: string;
    productId?: string;
    status?: string;
    warehouseId?: string;
  } = {}) {
    const and: any[] = [];

    if (search) {
      and.push({
        OR: [
          { variant: { sku: { contains: search, mode: "insensitive" } } },
          { variant: { product: { name: { contains: search, mode: "insensitive" } } } },
        ],
      });
    }

    if (productId && productId !== "all") {
      and.push({ variant: { product_id: productId } });
    }

    if (warehouseId && warehouseId !== "all") {
      and.push({ warehouse_id: warehouseId });
    }

    if (status && status !== "all") {
      if (status === "out_of_stock") and.push({ total_quantity: 0 });
      else if (status === "low_stock") and.push({ total_quantity: { gt: 0, lt: 10 } });
      else if (status === "in_stock") and.push({ total_quantity: { gte: 10 } });
    }

    const where = this.warehouseWhere(and.length > 0 ? { AND: and } : {});
    
    const paginated = await this.paginate<any>(
      (this.prisma as any).inventorySummary,
      where,
      page,
      limit,
      { 
        variant: { include: { product: true } },
        warehouse: true
      },
      { variant: { product: { name: "asc" } } }
    );

    const records = paginated.data;
    const variantIds = records.map((r: any) => r.variant_id);
    
    const relevantPurchaseItems = await (this.prisma as any).purchaseItem.findMany({
      where: this.tenantWhere({ variant_id: { in: variantIds } }),
      include: { purchase: { include: { supplier: true } } },
      orderBy: { purchase: { created_at: "desc" } },
    });

    const supplierByVariant = new Map<string, any>();
    for (const item of relevantPurchaseItems) {
      if (!supplierByVariant.has(item.variant_id)) {
        supplierByVariant.set(item.variant_id, item.purchase?.supplier ?? null);
      }
    }

    return {
      ...paginated,
      data: records.map((inv: any) => ({
        ...inv,
        quantity: inv.total_quantity, 
        supplier: supplierByVariant.get(inv.variant_id) ?? null,
      }))
    };
  }

  async findByVariantId(variantId: string, warehouseId?: string): Promise<any | null> {
    const record = await (this.prisma as any).inventorySummary.findFirst({
      where: this.tenantWhere({ variant_id: variantId, warehouse_id: warehouseId }),
      include: { variant: true, warehouse: true },
    });

    if (!record) return null;

    return {
      ...record,
      quantity: record.total_quantity,
    };
  }

  async adjustInventory(
    data: AdjustInventoryInput,
    txClient?: Prisma.TransactionClient,
  ): Promise<{ inventory: Inventory; ledger: InventoryLedger }> {
    const execute = async (tx: Prisma.TransactionClient) => {
      let updatedInventory: Inventory | null = null;

      if (data.action === "IN") {
        // Upsert keeps IN flow idempotent and safe under concurrency.
        await (tx as any).inventory.upsert({
          where: {
            variant_id_warehouse_id: {
              variant_id: data.variant_id,
              warehouse_id: data.warehouse_id,
            },
          },
          create: this.tenantData({
            variant_id: data.variant_id,
            warehouse_id: data.warehouse_id,
            quantity: data.quantity,
          }),
          update: {
            quantity: { increment: data.quantity },
          },
        });
      } else if (data.action === "OUT") {
        // Atomic stock decrement: succeeds only when enough stock exists.
        const decremented = await (tx as any).inventory.updateMany({
          where: this.tenantWhere({
            variant_id: data.variant_id,
            warehouse_id: data.warehouse_id,
            quantity: { gte: data.quantity },
          }),
          data: { quantity: { decrement: data.quantity } },
        });

        if (!decremented || decremented.count === 0) {
          throw new Error("Insufficient inventory");
        }
      }

      updatedInventory = await (tx as any).inventory.findFirst({
        where: this.tenantWhere({
          variant_id: data.variant_id,
          warehouse_id: data.warehouse_id,
        }),
      }) as Inventory | null;

      if (!updatedInventory) {
        throw new Error("Inventory state invalid");
      }

      // 4. Update Summary Table
      await (tx as any).inventorySummary.upsert({
        where: {
          organization_id_warehouse_id_variant_id: {
            organization_id: this.organizationId,
            warehouse_id: data.warehouse_id,
            variant_id: data.variant_id,
          },
        },
        update: { total_quantity: updatedInventory.quantity },
        create: this.tenantData({
          warehouse_id: data.warehouse_id,
          variant_id: data.variant_id,
          total_quantity: updatedInventory.quantity,
        }),
      });

      const ledgerRecord = await tx.inventoryLedger.create({
        data: this.tenantData({
          variant_id: data.variant_id,
          warehouse_id: data.warehouse_id,
          action: data.action as LedgerAction,
          quantity: data.quantity,
          reference_type: data.reference_type,
          reference_id: data.reference_id,
        }),
      });

      return { inventory: updatedInventory, ledger: ledgerRecord };
    };

    return txClient ? execute(txClient) : (this.prisma as PrismaClient).$transaction(execute);
  }

  async getLedgerByVariantId(variantId: string, warehouseId?: string): Promise<InventoryLedger[]> {
    const filter: any = { variant_id: variantId };
    if (warehouseId) filter.warehouse_id = warehouseId;

    return (this.prisma as any).inventoryLedger.findMany({
      where: this.tenantWhere(filter),
      include: { warehouse: true },
      orderBy: { created_at: "desc" },
    });
  }

  async count(search?: string, productId?: string, status?: string, warehouseId?: string): Promise<number> {
    const and: any[] = [];
    if (search) {
      and.push({
        OR: [
          { variant: { sku: { contains: search, mode: "insensitive" } } },
          { variant: { product: { name: { contains: search, mode: "insensitive" } } } },
        ],
      });
    }
    if (productId && productId !== "all") {
      and.push({ variant: { product_id: productId } });
    }
    if (warehouseId && warehouseId !== "all") {
      and.push({ warehouse_id: warehouseId });
    }
    if (status && status !== "all") {
      if (status === "out_of_stock") and.push({ total_quantity: 0 });
      else if (status === "low_stock") and.push({ total_quantity: { gt: 0, lt: 10 } });
      else if (status === "in_stock") and.push({ total_quantity: { gte: 10 } });
    }
    
    const where = this.warehouseWhere(and.length > 0 ? { AND: and } : {});
    return (this.prisma as any).inventorySummary.count({ where });
  }
}
