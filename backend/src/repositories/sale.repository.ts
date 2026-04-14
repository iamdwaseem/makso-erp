import { PrismaClient, Sale, Prisma } from "@prisma/client";
import { SaleInput } from "../validators/sale.validator.js";
import { InventoryRepository } from "./inventory.repository.js";
import crypto from "crypto";
import { BaseRepository } from "./BaseRepository.js";

function generateInvoiceNumber(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${date}-${suffix}`;
}

export class SaleRepository extends BaseRepository {
  private inventoryRepo: InventoryRepository;

  constructor(
    prisma: PrismaClient | Prisma.TransactionClient, 
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    super(prisma, organizationId, userId, userRole, allowedWarehouseIds);
    this.inventoryRepo = new InventoryRepository(this.prisma, organizationId, userId, userRole, allowedWarehouseIds);
  }

  private saleVisibilityWhere(includeDeleted: boolean, deletedOnly: boolean): Record<string, unknown> {
    if (deletedOnly) return { deleted_at: { not: null } };
    if (includeDeleted) return {};
    return { deleted_at: null };
  }

  async findAll({
    page = 1,
    limit = 50,
    includeDeleted = false,
    deletedOnly = false,
    search,
  }: { page?: number; limit?: number; includeDeleted?: boolean; deletedOnly?: boolean; search?: string } = {}) {
    const vis = this.saleVisibilityWhere(includeDeleted, deletedOnly);
    const whereBase = this.tenantWhere(vis);
    const q = search?.trim().slice(0, 200) ?? "";

    let where: Record<string, unknown> = whereBase;
    if (q.length > 0) {
      const or: Record<string, unknown>[] = [
        { invoice_number: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
      ];
      const uuidRe =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRe.test(q)) {
        or.push({ id: q });
      }
      where = { ...whereBase, OR: or };
    }

    const paginated = await this.paginate<any>(
      (this.prisma as any).sale,
      where,
      page,
      limit,
      {
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
        deletedBy: { select: { id: true, name: true, email: true } },
      },
      { created_at: "desc" }
    );

    const sales = paginated.data;
    const variantIds = Array.from(new Set(sales.flatMap((s: any) => s.items.map((i: any) => i.variant_id))));

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
      data: sales.map((sale: any) => ({
        ...sale,
        items: sale.items.map((item: any) => ({
          ...item,
          supplier: supplierByVariant.get(item.variant_id) ?? null,
        })),
      }))
    };
  }

  async count(opts?: { includeDeleted?: boolean; deletedOnly?: boolean }): Promise<number> {
    const vis = this.saleVisibilityWhere(!!opts?.includeDeleted, !!opts?.deletedOnly);
    return (this.prisma as any).sale.count({
      where: this.tenantWhere(vis),
    });
  }

  async findById(id: string, opts?: { includeDeleted?: boolean }): Promise<any | null> {
    const base: Record<string, unknown> = { id };
    if (!opts?.includeDeleted) base.deleted_at = null;
    const sale = await (this.prisma as any).sale.findFirst({
      where: this.tenantWhere(base),
      include: {
        customer: true,
        warehouse: true,
        items: { include: { variant: { include: { product: true } } } },
        deletedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!sale) return null;

    const allPurchaseItems = await (this.prisma as any).purchaseItem.findMany({
      where: this.tenantWhere({ variant_id: { in: sale.items.map((i: any) => i.variant_id) } }),
      include: { purchase: { include: { supplier: true } } },
      orderBy: { purchase: { created_at: "desc" } },
    });

    const supplierByVariant = new Map<string, any>();
    for (const item of allPurchaseItems) {
      if (!supplierByVariant.has(item.variant_id)) {
        supplierByVariant.set(item.variant_id, item.purchase?.supplier ?? null);
      }
    }

    return {
      ...sale,
      items: sale.items.map((item: any) => ({
        ...item,
        supplier: supplierByVariant.get(item.variant_id) ?? null,
      })),
    };
  }

  async createSale(data: SaleInput): Promise<Sale> {
    const txFunc = async (tx: Prisma.TransactionClient) => {
      const txInventoryRepo = new InventoryRepository(tx, this.organizationId, this.userId, this.userRole, this.allowedWarehouseIds);
      
      const sale = await tx.sale.create({
        data: this.tenantData({
          customer_id: data.customer_id,
          invoice_number: generateInvoiceNumber("SAL"),
          warehouse_id: data.warehouse_id,
          created_by: this.userId || "SYSTEM",
          total_amount: 0,
        }),
      });

      for (const item of data.items) {
        await tx.saleItem.create({
          data: this.tenantData({ sale_id: sale.id, variant_id: item.variant_id, quantity: item.quantity }),
        });
        await txInventoryRepo.adjustInventory(
          {
            variant_id: item.variant_id,
            warehouse_id: data.warehouse_id,
            action: "OUT",
            quantity: item.quantity,
            reference_type: "SALE",
            reference_id: sale.id
          },
          tx,
        );
      }

      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          customer: true,
          items: { include: { variant: { include: { product: true } } } },
        },
      }) as unknown as Sale;
    };

    if ((this.prisma as any).$transaction) {
      return (this.prisma as PrismaClient).$transaction(txFunc);
    } else {
      return txFunc(this.prisma as Prisma.TransactionClient);
    }
  }

  /**
   * Soft-delete sale (cancel delivery note): restore stock with IN + SALE_CANCEL_REVERSAL ledger rows.
   */
  async softDeleteSale(id: string, deletedByUserId: string | null): Promise<void> {
    const row = await (this.prisma as any).sale.findFirst({
      where: this.tenantWhere({ id }),
      include: { items: true },
    });
    if (!row) throw new Error("Sale not found");
    if (row.deleted_at) throw new Error("Sale already deleted");

    const warehouseId = row.warehouse_id as string;

    const txFunc = async (tx: Prisma.TransactionClient) => {
      const txInventoryRepo = new InventoryRepository(
        tx,
        this.organizationId,
        this.userId,
        this.userRole,
        this.allowedWarehouseIds
      );

      for (const item of row.items as any[]) {
        if (Number(item.quantity) > 0) {
          await txInventoryRepo.adjustInventory(
            {
              variant_id: item.variant_id,
              warehouse_id: warehouseId,
              action: "IN",
              quantity: item.quantity,
              reference_type: "SALE_CANCEL_REVERSAL",
              reference_id: id,
            },
            tx
          );
        }
      }

      await (tx as any).sale.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          deleted_by: deletedByUserId,
        },
      });
    };

    if ((this.prisma as any).$transaction) {
      await (this.prisma as PrismaClient).$transaction(txFunc);
    } else {
      await txFunc(this.prisma as Prisma.TransactionClient);
    }
  }
}
