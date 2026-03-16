import { Request, Response } from "express";
import { BaseController } from "./BaseController.js";
import prisma from "../lib/prisma.js";
import { WarehouseRequest } from "../middleware/warehouseAccess.middleware.js";
import { TenantRequest } from "../middleware/tenant.middleware.js";

type PeriodKey =
  | "last_7_days"
  | "last_30_days"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "custom";

function getDateRange(period: PeriodKey, startDate?: string, endDate?: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today);
  endOfToday.setDate(endOfToday.getDate() + 1);
  endOfToday.setMilliseconds(-1);

  if (period === "custom" && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  let start: Date;
  switch (period) {
    case "last_7_days":
      start = new Date(today);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfToday };
    case "last_30_days":
      start = new Date(today);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfToday };
    case "this_week": {
      const day = today.getDay();
      const sun = day === 0 ? 0 : -day;
      start = new Date(today);
      start.setDate(start.getDate() + sun);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfToday };
    }
    case "last_week": {
      const day = today.getDay();
      const sun = day === 0 ? -7 : -day - 7;
      start = new Date(today);
      start.setDate(start.getDate() + sun);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "this_month":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start, end: endOfToday };
    case "last_month":
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      return { start, end: endLastMonth };
    case "this_year":
      start = new Date(today.getFullYear(), 0, 1);
      return { start, end: endOfToday };
    case "last_year":
      start = new Date(today.getFullYear() - 1, 0, 1);
      const endLastYear = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { start, end: endLastYear };
    default:
      start = new Date(today);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfToday };
  }
}

export class DashboardController extends BaseController {
  async getStats(req: Request, res: Response) {
    try {
      const authReq = req as unknown as WarehouseRequest;
      const tenantReq = req as unknown as TenantRequest;
      const organizationId = tenantReq.tenant?.organizationId;
      const warehouseId = (req.query.warehouseId as string) || "all";

      if (!organizationId) {
        throw new Error("Tenant context missing");
      }

      // 1. Determine which precomputed metrics to fetch
      const precomputedWhere: any = { organization_id: organizationId };
      if (warehouseId && warehouseId !== "all") {
        precomputedWhere.warehouse_id = warehouseId;
      } else {
        if (authReq.userRole === "ADMIN") {
          precomputedWhere.warehouse_id = null;
        } else if (authReq.allowedWarehouseIds.length === 1) {
          precomputedWhere.warehouse_id = authReq.allowedWarehouseIds[0];
        } else {
          precomputedWhere.warehouse_id = undefined;
        }
      }

      // 2. Fetch Lists dynamically (Respects Warehouse Permissions)
      const where: any = { organization_id: organizationId };
      if (warehouseId && warehouseId !== "all") {
        where.warehouse_id = warehouseId;
      } else if (authReq.userRole !== "ADMIN") {
        where.warehouse_id = { in: authReq.allowedWarehouseIds };
      }

      // Include category when the categories table exists (migration applied)
      const productIncludeWithCategory = { product: { include: { category: true } } };
      const productIncludeNoCategory = { product: true };
      let productInclude: typeof productIncludeWithCategory | typeof productIncludeNoCategory = productIncludeWithCategory;
      try {
        await (prisma as any).product.findFirst({ where: { organization_id: organizationId }, include: { category: true }, take: 1 });
      } catch (_e: any) {
        const msg = String(_e?.message ?? "");
        if (msg.includes("categories") || msg.includes("relation") || msg.includes("does not exist")) {
          productInclude = productIncludeNoCategory;
        } else {
          throw _e;
        }
      }

      const [topStocked, recentLedger, lowStock, allSummariesForGroups] = await Promise.all([
        (prisma as any).inventorySummary.findMany({
          where,
          include: { variant: { include: productInclude }, warehouse: true },
          orderBy: { total_quantity: "desc" },
          take: 10,
        }),
        (prisma as any).inventoryLedger.findMany({
          where,
          include: { variant: { include: productInclude }, warehouse: true },
          orderBy: { created_at: "desc" },
          take: 15,
        }),
        (prisma as any).inventorySummary.findMany({
          where: { ...where, total_quantity: { lt: 10 } },
          include: { variant: { include: productInclude }, warehouse: true },
          orderBy: { total_quantity: "asc" },
          take: 50,
        }),
        (prisma as any).inventorySummary.findMany({
          where,
          include: { variant: { include: productInclude } },
        }),
      ]);

      // 3. Get counts
      let counts: any = {};
      let calculatedAt = new Date();
      let isPrecomputed = false;
      let totalSuppliers = 0;
      let totalCustomers = 0;
      let totalPurchases = 0;
      let totalSales = 0;

      [totalSuppliers, totalCustomers, totalPurchases, totalSales] = await Promise.all([
        (prisma as any).supplier.count({ where: { organization_id: organizationId } }),
        (prisma as any).customer.count({ where: { organization_id: organizationId } }),
        (prisma as any).purchase.count({ where: { organization_id: organizationId } }),
        (prisma as any).sale.count({ where: { organization_id: organizationId } }),
      ]);

      if (precomputedWhere.warehouse_id !== undefined) {
        const precomputed = await (prisma as any).dashboardMetrics.findFirst({
          where: precomputedWhere,
          orderBy: { calculated_at: "desc" }
        });
        if (precomputed) {
          counts = {
            totalProducts: precomputed.total_products,
            totalVariants: precomputed.total_variants,
            totalSuppliers,
            totalCustomers,
            totalPurchases,
            totalSales,
            totalUnits: precomputed.total_stock,
            totalStock: precomputed.total_stock,
            totalSalesToday: precomputed.total_sales_today,
            totalPurchasesToday: precomputed.total_purchases_today,
            lowStockCount: precomputed.low_stock_items
          };
          calculatedAt = precomputed.calculated_at;
          isPrecomputed = true;
        }
      }

      if (!isPrecomputed) {
        const [
          totalProducts,
          totalVariants,
          inventorySum,
        ] = await Promise.all([
          (prisma as any).product.count({ where: { organization_id: organizationId } }),
          (prisma as any).variant.count({ where: { organization_id: organizationId } }),
          (prisma as any).inventorySummary.aggregate({ where, _sum: { total_quantity: true } }),
        ]);

        const totalUnits = (inventorySum as any)?._sum?.total_quantity || 0;
        counts = {
          totalProducts,
          totalVariants,
          totalSuppliers,
          totalCustomers,
          totalPurchases,
          totalSales,
          totalUnits,
          totalStock: totalUnits,
          lowStockCount: lowStock.length
        };
      }

      const mapInv = (items: any[]) => items.map(i => ({ ...i, quantity: i.total_quantity }));

      // Item groups: aggregate by category (when available) or product name for pie chart
      const groupByCategory = new Map<string, number>();
      for (const row of allSummariesForGroups || []) {
        const cat = (row as any).variant?.product?.category;
        const name = (cat?.name as string) || (row.variant?.product?.name as string) || "Other";
        groupByCategory.set(name, (groupByCategory.get(name) || 0) + (row.total_quantity || 0));
      }
      const itemGroups = Array.from(groupByCategory.entries())
        .map(([name, value]) => ({ name, value }))
        .filter((g) => g.value > 0)
        .sort((a, b) => b.value - a.value);

      // Low stock in resue shape: variantId, product, variant, sku, quantity, reorderLevel
      const defaultReorderLevel = 10;
      const lowStockRows = (lowStock || []).map((i: any) => ({
        variantId: i.variant_id,
        product: i.variant?.product?.name ?? "—",
        variant: i.variant?.color ?? "—",
        sku: i.variant?.sku ?? "—",
        quantity: i.total_quantity ?? 0,
        reorderLevel: defaultReorderLevel,
      }));

      return this.success(res, {
        counts,
        itemGroups,
        lowStock: mapInv(lowStock),
        lowStockRows,
        topStocked: mapInv(topStocked),
        recentActivity: recentLedger,
        calculatedAt,
        isPrecomputed
      });
    } catch (error: any) {
      console.error("[Dashboard getStats]", error?.message ?? error);
      return this.handleError(res, error);
    }
  }

  async getInventoryTrend(req: Request, res: Response) {
    try {
      const authReq = req as unknown as WarehouseRequest;
      const tenantReq = req as unknown as TenantRequest;
      const organizationId = tenantReq.tenant?.organizationId;
      const warehouseId = (req.query.warehouseId as string) || "all";
      const period = (req.query.period as PeriodKey) || "last_30_days";
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      if (!organizationId) throw new Error("Tenant context missing");

      const { start, end } = getDateRange(period, startDate, endDate);

      const where: any = { organization_id: organizationId, created_at: { gte: start, lte: end } };
      if (warehouseId && warehouseId !== "all") {
        where.warehouse_id = warehouseId;
      } else if (authReq.userRole !== "ADMIN") {
        where.warehouse_id = { in: authReq.allowedWarehouseIds };
      }

      const ledger = await (prisma as any).inventoryLedger.findMany({
        where,
        select: { action: true, quantity: true, created_at: true },
      });

      const summaryWhere: any = { organization_id: organizationId };
      if (warehouseId && warehouseId !== "all") {
        summaryWhere.warehouse_id = warehouseId;
      } else if (authReq.userRole !== "ADMIN") {
        summaryWhere.warehouse_id = { in: authReq.allowedWarehouseIds };
      }
      const current = await (prisma as any).inventorySummary.aggregate({
        where: summaryWhere,
        _sum: { total_quantity: true },
      });
      const currentTotal = Number(current?._sum?.total_quantity ?? 0);

      type DayKey = string;
      const dayNet = new Map<DayKey, number>();
      let totalNetInRange = 0;
      for (const row of ledger) {
        const d = new Date(row.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const q = Number(row.quantity ?? 0);
        const net = row.action === "IN" ? q : -q;
        dayNet.set(key, (dayNet.get(key) ?? 0) + net);
        totalNetInRange += net;
      }

      const startBalance = currentTotal - totalNetInRange;
      const allDays: string[] = [];
      const cur = new Date(start);
      cur.setHours(0, 0, 0, 0);
      const endDay = new Date(end);
      endDay.setHours(0, 0, 0, 0);
      while (cur <= endDay) {
        allDays.push(
          `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`
        );
        cur.setDate(cur.getDate() + 1);
      }
      let running = startBalance;
      const data: { date: string; value: number }[] = [];
      for (const d of allDays) {
        running += dayNet.get(d) ?? 0;
        data.push({ date: d, value: Math.max(0, running) });
      }

      return this.success(res, { data });
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  async getInventoryGainLoss(req: Request, res: Response) {
    try {
      const authReq = req as unknown as WarehouseRequest;
      const tenantReq = req as unknown as TenantRequest;
      const organizationId = tenantReq.tenant?.organizationId;
      const warehouseId = (req.query.warehouseId as string) || "all";
      const period = (req.query.period as PeriodKey) || "last_30_days";
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      if (!organizationId) throw new Error("Tenant context missing");

      const { start, end } = getDateRange(period, startDate, endDate);

      const where: any = { organization_id: organizationId, created_at: { gte: start, lte: end } };
      if (warehouseId && warehouseId !== "all") {
        where.warehouse_id = warehouseId;
      } else if (authReq.userRole !== "ADMIN") {
        where.warehouse_id = { in: authReq.allowedWarehouseIds };
      }

      const ledger = await (prisma as any).inventoryLedger.findMany({
        where,
        select: { action: true, quantity: true },
      });

      let gain = 0;
      let loss = 0;
      for (const row of ledger) {
        const q = Number(row.quantity ?? 0);
        if (row.action === "IN") gain += q;
        else loss += q;
      }

      return this.success(res, { gain, loss });
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }
}
