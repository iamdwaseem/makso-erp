import { PrismaClient, Prisma } from "@prisma/client";
import { BaseRepository } from "./BaseRepository.js";

export class DashboardRepository extends BaseRepository {
  constructor(
    prisma: PrismaClient | Prisma.TransactionClient,
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    super(prisma, organizationId, userId, userRole, allowedWarehouseIds);
  }

  private get where() {
    return this.warehouseWhere({});
  }

  /** Stats for home dashboard */
  async getStats(from?: Date, to?: Date, warehouseId?: string) {
    const p = this.prisma as any;
    const where: any = this.tenantWhere({});
    const saleWhere: any = { ...where, status: "SUBMITTED" };
    const purchaseWhere: any = { ...where, status: "SUBMITTED" };
    if (from) {
      saleWhere.created_at = saleWhere.created_at || {};
      saleWhere.created_at.gte = from;
      purchaseWhere.created_at = purchaseWhere.created_at || {};
      purchaseWhere.created_at.gte = from;
    }
    if (to) {
      saleWhere.created_at = saleWhere.created_at || {};
      saleWhere.created_at.lte = to;
      purchaseWhere.created_at = purchaseWhere.created_at || {};
      purchaseWhere.created_at.lte = to;
    }
    if (warehouseId && warehouseId !== "all") {
      saleWhere.warehouse_id = warehouseId;
      purchaseWhere.warehouse_id = warehouseId;
    }

    const [sales, creditNotesCount, openSales, purchases, openPurchases, paymentJoin, adjustments, inventoryRows, variants] = await Promise.all([
      p.sale.aggregate({ where: saleWhere, _sum: { total_amount: true }, _count: { id: true } }),
      p.creditNote.count({ where: { ...where, status: "SUBMITTED" } }),
      p.sale.count({ where: { ...where, status: { in: ["DRAFT", "SUBMITTED"] } } }),
      p.purchase.aggregate({ where: purchaseWhere, _sum: { total_amount: true }, _count: { id: true } }),
      p.purchase.count({ where: { ...where, status: { in: ["DRAFT", "SUBMITTED"] } } }),
      p.sale.findMany({
        where: saleWhere,
        select: { id: true, payments: { select: { amount: true } } },
      }),
      p.adjustment.findMany({ where: this.tenantWhere({}) }),
      p.inventory.findMany({
        where: warehouseId && warehouseId !== "all" ? { ...where, warehouse_id: warehouseId } : where,
        include: { variant: true },
      }),
      p.variant.findMany({ where: this.tenantWhere({ deleted_at: null }), select: { id: true, reorder_level: true } }),
    ]);
    const collection = (paymentJoin as any[]).reduce((sum, s) => sum + (s.payments?.reduce((a: number, p: any) => a + Number(p.amount), 0) ?? 0), 0);

    const totalSales = Number(sales._sum?.total_amount ?? 0);
    const creditSales = Math.max(0, totalSales - collection);
    const cashSales = Math.min(totalSales, collection);

    let gain = 0;
    let loss = 0;
    for (const a of adjustments) {
      if (a.quantity > 0) gain += a.quantity;
      else loss += Math.abs(a.quantity);
    }

    const variantIds = new Set(inventoryRows.map((r: any) => r.variant_id));
    const variantReorder = new Map(variants.map((v: any) => [v.id, v.reorder_level]));
    let lowStockItems = 0;
    const byVariant = new Map<string, number>();
    for (const r of inventoryRows) {
      const q = (byVariant.get(r.variant_id) || 0) + r.quantity;
      byVariant.set(r.variant_id, q);
    }
    for (const [vid, qty] of byVariant) {
      const reorder = variantReorder.get(vid) ?? 0;
      if (qty < reorder) lowStockItems++;
    }

    return {
      totalSales,
      cashSales,
      creditSales,
      creditNotesCount,
      openSaleInvoices: openSales,
      openPurchaseInvoices: openPurchases,
      collection,
      expenseClaims: 0,
      lowStockItems,
      gain,
      loss,
    };
  }

  /** Monthly sales and purchases for trend */
  async getSalesPurchaseTrend(from: Date, to: Date, warehouseId?: string) {
    const p = this.prisma as any;
    const where: any = this.tenantWhere({ status: "SUBMITTED" });
    if (warehouseId && warehouseId !== "all") where.warehouse_id = warehouseId;

    const sales = await p.sale.findMany({
      where: { ...where, created_at: { gte: from, lte: to } },
      select: { total_amount: true, created_at: true },
    });
    const purchases = await p.purchase.findMany({
      where: { ...where, created_at: { gte: from, lte: to } },
      select: { total_amount: true, created_at: true },
    });

    const periodMap = new Map<string, { sales: number; purchases: number }>();
    const start = new Date(from);
    const end = new Date(to);
    for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      periodMap.set(key, { sales: 0, purchases: 0 });
    }
    for (const s of sales) {
      const key = `${s.created_at.getFullYear()}-${String(s.created_at.getMonth() + 1).padStart(2, "0")}`;
      const v = periodMap.get(key);
      if (v) v.sales += Number(s.total_amount);
    }
    for (const p of purchases) {
      const key = `${p.created_at.getFullYear()}-${String(p.created_at.getMonth() + 1).padStart(2, "0")}`;
      const v = periodMap.get(key);
      if (v) v.purchases += Number(p.total_amount);
    }
    return Array.from(periodMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, v]) => ({ period, sales: v.sales, purchases: v.purchases }));
  }

  /** Monthly inventory value trend */
  async getInventoryTrend(from: Date, to: Date, warehouseId?: string) {
    const p = this.prisma as any;
    const where: any = this.tenantWhere({});
    const invWhere = warehouseId && warehouseId !== "all" ? { ...where, warehouse_id: warehouseId } : where;

    const invNow = await p.inventory.findMany({
      where: invWhere,
      include: { variant: { select: { valuation_rate: true } } },
    });
    let currentValue = 0;
    for (const i of invNow) {
      currentValue += i.quantity * Number((i.variant as any)?.valuation_rate ?? 0);
    }

    const ledgerWhere: any = { ...where, created_at: { lte: to } };
    if (warehouseId && warehouseId !== "all") ledgerWhere.warehouse_id = warehouseId;
    const ledger = await p.inventoryLedger.findMany({
      where: ledgerWhere,
      include: { variant: { select: { valuation_rate: true } } },
      orderBy: { created_at: "asc" },
    });

    const periods: string[] = [];
    for (let d = new Date(from.getFullYear(), from.getMonth(), 1); d <= to; d.setMonth(d.getMonth() + 1)) {
      periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    if (periods.length === 0) {
      return [{ period: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`, value: currentValue }];
    }

    const periodEnds = periods.map((period) => {
      const [y, m] = period.split("-").map(Number);
      return { period, end: new Date(y, m, 0, 23, 59, 59, 999) };
    });
    const result: { period: string; value: number }[] = [];
    let idx = 0;
    const balanceByVariant = new Map<string, number>();
    const rates = new Map<string, number>();

    for (const entry of ledger) {
      while (idx < periodEnds.length && entry.created_at > periodEnds[idx].end) {
        let value = 0;
        balanceByVariant.forEach((qty, vid) => {
          value += qty * (rates.get(vid) || 0);
        });
        result.push({ period: periodEnds[idx].period, value: Math.max(0, value) });
        idx++;
      }
      const rate = Number((entry.variant as any)?.valuation_rate ?? 0);
      rates.set(entry.variant_id, rate);
      balanceByVariant.set(entry.variant_id, (balanceByVariant.get(entry.variant_id) || 0) + entry.quantity);
    }
    while (idx < periodEnds.length) {
      let value = 0;
      balanceByVariant.forEach((qty, vid) => {
        value += qty * (rates.get(vid) || 0);
      });
      result.push({ period: periodEnds[idx].period, value: Math.max(0, value) });
      idx++;
    }
    if (result.length > 0) result[result.length - 1].value = currentValue;
    return result;
  }

  /** Employee sales (we have no user on sale - return single aggregated row) */
  async getEmployeeSales(_from?: Date, _to?: Date, warehouseId?: string) {
    const p = this.prisma as any;
    const where: any = this.warehouseWhere({ status: "SUBMITTED" });
    if (warehouseId && warehouseId !== "all") where.warehouse_id = warehouseId;
    const agg = await p.sale.aggregate({
      where,
      _sum: { total_amount: true },
      _count: { id: true },
    });
    return [{ employee: "All", count: agg._count.id ?? 0, revenue: Number(agg._sum?.total_amount ?? 0) }];
  }

  /** Item groups: by product name (we have no item_group), value = total quantity */
  async getItemGroups(warehouseId?: string) {
    const p = this.prisma as any;
    const where: any = this.tenantWhere({});
    if (warehouseId && warehouseId !== "all") where.warehouse_id = warehouseId;
    const inv = await p.inventory.findMany({
      where,
      include: { variant: { include: { product: true } } },
    });
    const byProduct = new Map<string, number>();
    for (const i of inv) {
      const name = (i.variant?.product as any)?.name ?? "Other";
      byProduct.set(name, (byProduct.get(name) || 0) + i.quantity);
    }
    return Array.from(byProduct.entries()).map(([name, value]) => ({ name, value }));
  }

  /** Monthly stock in (GRN) and stock out (GDN) quantities for trend chart */
  async getStockInOutTrend(from: Date, to: Date, warehouseId?: string) {
    const p = this.prisma as any;
    const where: any = this.tenantWhere({ status: "SUBMITTED" });
    if (warehouseId && warehouseId !== "all") where.warehouse_id = warehouseId;

    const grns = await p.grn.findMany({
      where: { ...where, created_at: { gte: from, lte: to } },
      select: { created_at: true, items: { select: { quantity: true } } },
    });
    const gdns = await p.gdn.findMany({
      where: { ...where, created_at: { gte: from, lte: to } },
      select: { created_at: true, items: { select: { quantity: true } } },
    });

    const periodMap = new Map<string, { stockIn: number; stockOut: number }>();
    const start = new Date(from);
    const end = new Date(to);
    for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      periodMap.set(key, { stockIn: 0, stockOut: 0 });
    }
    for (const g of grns) {
      const key = `${g.created_at.getFullYear()}-${String(g.created_at.getMonth() + 1).padStart(2, "0")}`;
      const v = periodMap.get(key);
      if (v) v.stockIn += (g.items || []).reduce((s: number, i: any) => s + Number(i.quantity || 0), 0);
    }
    for (const g of gdns) {
      const key = `${g.created_at.getFullYear()}-${String(g.created_at.getMonth() + 1).padStart(2, "0")}`;
      const v = periodMap.get(key);
      if (v) v.stockOut += (g.items || []).reduce((s: number, i: any) => s + Number(i.quantity || 0), 0);
    }
    return Array.from(periodMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, v]) => ({ period, stockIn: v.stockIn, stockOut: v.stockOut }));
  }

  /** Gain/loss from adjustments */
  async getGainLoss(warehouseId?: string) {
    const p = this.prisma as any;
    const where: any = this.tenantWhere({});
    if (warehouseId && warehouseId !== "all") where.warehouse_id = warehouseId;
    const list = await p.adjustment.findMany({ where });
    let gain = 0;
    let loss = 0;
    for (const a of list) {
      if (a.quantity > 0) gain += a.quantity;
      else loss += Math.abs(a.quantity);
    }
    return { gain, loss };
  }
}
