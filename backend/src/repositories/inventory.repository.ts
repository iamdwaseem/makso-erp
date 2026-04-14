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

    const variantIdList = variantIds
      .filter((v: any): v is string => typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v))
      .map((v: string) => `'${v}'::uuid`)
      .join(",");

    // Fetch only the latest purchase/supplier per variant (much less data than fetching all purchase_items).
    const latestPurchases = variantIdList.length
      ? await (this.prisma as any).$queryRawUnsafe(
          `
          SELECT DISTINCT ON (pi.variant_id)
            pi.variant_id,
            p.id            AS purchase_id,
            p.invoice_number,
            p.created_at    AS purchase_created_at,
            s.id            AS supplier_id,
            s.name          AS supplier_name,
            s.code          AS supplier_code,
            s.phone         AS supplier_phone,
            s.address       AS supplier_address
          FROM purchase_items pi
          JOIN purchases p ON p.id = pi.purchase_id
          JOIN suppliers s ON s.id = p.supplier_id
          WHERE pi.organization_id = $1::uuid
            AND pi.variant_id IN (${variantIdList})
          ORDER BY pi.variant_id, p.created_at DESC;
        `,
          this.organizationId
        )
      : [];

    const supplierByVariant = new Map<string, any>();
    const lastPurchaseByVariant = new Map<string, { id: string; invoice_number: string; created_at: Date }>();
    for (const row of latestPurchases as any[]) {
      supplierByVariant.set(row.variant_id, row.supplier_id ? {
        id: row.supplier_id,
        name: row.supplier_name,
        code: row.supplier_code,
        phone: row.supplier_phone,
        address: row.supplier_address,
      } : null);
      if (row.purchase_id) {
        lastPurchaseByVariant.set(row.variant_id, {
          id: row.purchase_id,
          invoice_number: row.invoice_number,
          created_at: row.purchase_created_at,
        });
      }
    }

    const latestSales = variantIdList.length
      ? await (this.prisma as any).$queryRawUnsafe(
          `
          SELECT DISTINCT ON (si.variant_id)
            si.variant_id,
            s.id            AS sale_id,
            s.invoice_number,
            s.created_at    AS sale_created_at
          FROM sale_items si
          JOIN sales s ON s.id = si.sale_id
          WHERE si.organization_id = $1::uuid
            AND si.variant_id IN (${variantIdList})
          ORDER BY si.variant_id, s.created_at DESC;
        `,
          this.organizationId
        )
      : [];

    const lastSaleByVariant = new Map<string, { id: string; invoice_number: string; created_at: Date }>();
    for (const row of latestSales as any[]) {
      if (row.sale_id) {
        lastSaleByVariant.set(row.variant_id, {
          id: row.sale_id,
          invoice_number: row.invoice_number,
          created_at: row.sale_created_at,
        });
      }
    }

    return {
      ...paginated,
      data: records.map((inv: any) => ({
        ...inv,
        quantity: inv.total_quantity, 
        supplier: supplierByVariant.get(inv.variant_id) ?? null,
        lastPurchase: lastPurchaseByVariant.get(inv.variant_id) ?? null,
        lastSale: lastSaleByVariant.get(inv.variant_id) ?? null,
      }))
    };
  }

  async findByVariantId(variantId: string, warehouseId?: string): Promise<any | null> {
    const record = await (this.prisma as any).inventorySummary.findFirst({
      where: this.tenantWhere({ variant_id: variantId, warehouse_id: warehouseId }),
      include: { variant: { include: { product: true } }, warehouse: true },
    });

    if (!record) return null;

    const lastPurchaseRow = await (this.prisma as any).$queryRaw`
      SELECT
        p.id            AS purchase_id,
        p.invoice_number,
        p.created_at    AS purchase_created_at,
        s.id            AS supplier_id,
        s.name          AS supplier_name,
        s.code          AS supplier_code,
        s.phone         AS supplier_phone,
        s.address       AS supplier_address
      FROM purchase_items pi
      JOIN purchases p ON p.id = pi.purchase_id
      JOIN suppliers s ON s.id = p.supplier_id
      WHERE pi.organization_id = ${this.organizationId}::uuid
        AND pi.variant_id = ${variantId}::uuid
      ORDER BY p.created_at DESC
      LIMIT 1;
    `;

    const lastSaleRow = await (this.prisma as any).$queryRaw`
      SELECT
        s.id            AS sale_id,
        s.invoice_number,
        s.created_at    AS sale_created_at
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE si.organization_id = ${this.organizationId}::uuid
        AND si.variant_id = ${variantId}::uuid
      ORDER BY s.created_at DESC
      LIMIT 1;
    `;

    const lp = Array.isArray(lastPurchaseRow) ? lastPurchaseRow[0] : (lastPurchaseRow as any);
    const ls = Array.isArray(lastSaleRow) ? lastSaleRow[0] : (lastSaleRow as any);

    return {
      ...record,
      quantity: record.total_quantity,
      supplier: lp?.supplier_id
        ? {
            id: lp.supplier_id,
            name: lp.supplier_name,
            code: lp.supplier_code,
            phone: lp.supplier_phone,
            address: lp.supplier_address,
          }
        : null,
      lastPurchase: lp?.purchase_id
        ? {
            id: lp.purchase_id,
            invoice_number: lp.invoice_number,
            created_at: lp.purchase_created_at,
          }
        : null,
      lastSale: ls?.sale_id
        ? {
            id: ls.sale_id,
            invoice_number: ls.invoice_number,
            created_at: ls.sale_created_at,
          }
        : null,
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
