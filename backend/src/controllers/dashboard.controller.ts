import { Request, Response } from "express";
import { BaseController } from "./BaseController.js";
import prisma from "../lib/prisma.js";
import { WarehouseRequest } from "../middleware/warehouseAccess.middleware.js";
import { TenantRequest } from "../middleware/tenant.middleware.js";

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

      const [topStocked, recentLedger, lowStock] = await Promise.all([
        (prisma as any).inventorySummary.findMany({
          where,
          include: { variant: { include: { product: true } }, warehouse: true },
          orderBy: { total_quantity: "desc" },
          take: 10,
        }),
        (prisma as any).inventoryLedger.findMany({
          where,
          include: { variant: { include: { product: true } }, warehouse: true },
          orderBy: { created_at: "desc" },
          take: 15,
        }),
        (prisma as any).inventorySummary.findMany({
          where: { ...where, total_quantity: { lt: 10 } },
          include: { variant: { include: { product: true } }, warehouse: true },
          orderBy: { total_quantity: "asc" },
          take: 10,
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

      return this.success(res, {
        counts,
        lowStock: mapInv(lowStock),
        topStocked: mapInv(topStocked),
        recentActivity: recentLedger,
        calculatedAt,
        isPrecomputed
      });
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }
}
