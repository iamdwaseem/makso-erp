import { PrismaClient, Prisma } from "@prisma/client";
import { BaseRepository } from "./BaseRepository.js";

export class ReportRepository extends BaseRepository {
  constructor(
    prisma: PrismaClient | Prisma.TransactionClient,
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    super(prisma, organizationId, userId, userRole, allowedWarehouseIds);
  }

  /** Stock report: product, variant, warehouse, quantity, value */
  async getStockReport(warehouseId?: string) {
    const p = this.prisma as any;
    const where: any = this.warehouseWhere({});
    if (warehouseId && warehouseId !== "all") where.warehouse_id = warehouseId;
    const rows = await p.inventory.findMany({
      where,
      include: {
        variant: { include: { product: true } },
        warehouse: true,
      },
    });
    return rows.map((r: any) => ({
      product: (r.variant?.product as any)?.name ?? "",
      variant: (r.variant as any)?.color ?? (r.variant as any)?.sku ?? "",
      warehouse: (r.warehouse as any)?.name ?? "",
      quantity: r.quantity,
      value: r.quantity * Number((r.variant as any)?.valuation_rate ?? 0),
    }));
  }

  /** Low stock: variants where total quantity < reorder_level, or out of stock (qty === 0) */
  async getLowStockReport(warehouseId?: string) {
    const p = this.prisma as any;
    const where: any = this.tenantWhere({ deleted_at: null });
    const invWhere: any = this.warehouseWhere({});
    if (warehouseId && warehouseId !== "all") invWhere.warehouse_id = warehouseId;
    const variants = await p.variant.findMany({
      where,
      include: { product: true },
    });
    const inv = await p.inventory.findMany({ where: invWhere });
    const qtyByVariant = new Map<string, number>();
    for (const i of inv) {
      qtyByVariant.set(i.variant_id, (qtyByVariant.get(i.variant_id) || 0) + i.quantity);
    }
    const result: any[] = [];
    const reorderDefault = 0;
    for (const v of variants) {
      const qty = qtyByVariant.get(v.id) ?? 0;
      const reorderLevel = v.reorder_level ?? reorderDefault;
      const isLow = reorderLevel > 0 ? qty < reorderLevel : qty === 0;
      if (isLow) {
        result.push({
          variantId: v.id,
          product: (v.product as any)?.name ?? "",
          variant: v.color ?? v.sku ?? "",
          sku: v.sku,
          quantity: qty,
          reorderLevel,
        });
      }
    }
    return result;
  }

  /** Ledger entries (transactions) */
  async getTransactionsReport(params?: { from?: Date; to?: Date; warehouseId?: string; limit?: number }) {
    const p = this.prisma as any;
    const where: any = this.warehouseWhere({});
    if (params?.from || params?.to) {
      where.created_at = {};
      if (params.from) where.created_at.gte = params.from;
      if (params.to) where.created_at.lte = params.to;
    }
    if (params?.warehouseId && params.warehouseId !== "all") where.warehouse_id = params.warehouseId;
    const rows = await p.inventoryLedger.findMany({
      where,
      include: { variant: { include: { product: true } }, warehouse: true },
      orderBy: { created_at: "desc" },
      take: Math.min(params?.limit ?? 500, 1000),
    });
    return rows.map((r: any) => ({
      id: r.id,
      variantId: r.variant_id,
      product: (r.variant?.product as any)?.name ?? "",
      variant: (r.variant as any)?.color ?? (r.variant as any)?.sku ?? "",
      warehouse: (r.warehouse as any)?.name ?? "",
      quantity: r.quantity,
      type: r.type,
      referenceId: r.reference_id,
      createdAt: r.created_at,
    }));
  }

  /** Sales summary (aggregated) */
  async getSalesSummaryReport(params?: { from?: Date; to?: Date; warehouseId?: string }) {
    const p = this.prisma as any;
    const where: any = this.warehouseWhere({ status: "SUBMITTED" });
    if (params?.from || params?.to) {
      where.created_at = {};
      if (params.from) where.created_at.gte = params.from;
      if (params.to) where.created_at.lte = params.to;
    }
    if (params?.warehouseId && params.warehouseId !== "all") where.warehouse_id = params.warehouseId;
    const [agg, count] = await Promise.all([
      p.sale.aggregate({ where, _sum: { total_amount: true } }),
      p.sale.count({ where }),
    ]);
    return {
      totalSales: count,
      totalRevenue: Number(agg._sum?.total_amount ?? 0),
    };
  }

  /** Inventory valuation (total or by warehouse) */
  async getInventoryValuationReport(warehouseId?: string) {
    const p = this.prisma as any;
    const where: any = this.warehouseWhere({});
    if (warehouseId && warehouseId !== "all") where.warehouse_id = warehouseId;
    const rows = await p.inventory.findMany({
      where,
      include: { variant: true, warehouse: true },
    });
    let totalValue = 0;
    const byWarehouse = new Map<string, number>();
    for (const r of rows) {
      const val = r.quantity * Number((r.variant as any)?.valuation_rate ?? 0);
      totalValue += val;
      const wh = (r.warehouse as any)?.name ?? r.warehouse_id;
      byWarehouse.set(wh, (byWarehouse.get(wh) || 0) + val);
    }
    return {
      totalValue,
      byWarehouse: Array.from(byWarehouse.entries()).map(([warehouse, value]) => ({ warehouse, value })),
    };
  }

  /** Customer aging: outstanding per customer (sales total - payments) */
  async getCustomerAgingReport() {
    const p = this.prisma as any;
    const where = this.tenantWhere({ status: "SUBMITTED" });
    const sales = await p.sale.findMany({
      where,
      include: { customer: true, payments: true },
    });
    return sales.map((s: any) => {
      const total = Number(s.total_amount ?? 0);
      const paid = (s.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const outstanding = Math.max(0, total - paid);
      if (outstanding === 0) return null;
      return {
        customerId: s.customer_id,
        customerName: (s.customer as any)?.name ?? "",
        saleId: s.id,
        totalAmount: total,
        paidAmount: paid,
        outstanding,
        createdAt: s.created_at,
      };
    }).filter(Boolean);
  }

  /** Supplier aging: outstanding purchases per supplier */
  async getSupplierAgingReport() {
    const p = this.prisma as any;
    const where = this.tenantWhere({ status: "SUBMITTED" });
    const purchases = await p.purchase.findMany({
      where,
      include: { supplier: true },
    });
    return purchases.map((p: any) => ({
      supplierId: p.supplier_id,
      supplierName: (p.supplier as any)?.name ?? "",
      purchaseId: p.id,
      totalAmount: Number(p.total_amount ?? 0),
      outstanding: Number(p.total_amount ?? 0),
      createdAt: p.created_at,
    })).filter((x: any) => x.outstanding > 0);
  }

  /** Inventory movement history (same as transactions - ledger) */
  async getInventoryMovementHistory(params?: { from?: Date; to?: Date; warehouseId?: string; limit?: number }) {
    return this.getTransactionsReport(params);
  }
}
