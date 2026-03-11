import prisma from "../lib/prisma.js";
import { getEnv } from "../config/env.js";

export class DashboardMetricsService {
  private shouldLog = getEnv().HTTP_LOGS === "true";
  /**
   * Calculates and stores dashboard metrics for a specific organization and optionally a warehouse.
   */
  async calculateAndStoreMetrics(organizationId: string, warehouseId?: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const filter: any = { organization_id: organizationId };
    if (warehouseId) filter.warehouse_id = warehouseId;

    const orgWhere = { organization_id: organizationId };

    await (prisma as any).$transaction(async (tx: any) => {
      // Set RLS context for this transaction
      await tx.$executeRawUnsafe(`SELECT set_config('app.organization_id', '${organizationId}', true)`);

      const [
        totalProducts,
        totalVariants,
        inventorySum,
        totalSalesToday,
        totalPurchasesToday,
        lowStockCount
      ] = await Promise.all([
        tx.product.count({ where: orgWhere }),
        tx.variant.count({ where: orgWhere }),
        tx.inventorySummary.aggregate({ 
            where: filter, 
            _sum: { total_quantity: true } 
        }),
        tx.sale.count({ 
            where: { 
                ...orgWhere, 
                sale_date: { gte: startOfToday } 
            } 
        }),
        tx.purchase.count({ 
            where: { 
                ...orgWhere, 
                purchase_date: { gte: startOfToday } 
            } 
        }),
        tx.inventorySummary.count({ 
            where: { 
                ...filter, 
                total_quantity: { lt: 10 } 
            } 
        })
      ]);

      const totalStock = inventorySum?._sum?.total_quantity || 0;

      // Find existing metrics record for this context
      const existing = await tx.dashboardMetrics.findFirst({
          where: {
              organization_id: organizationId,
              warehouse_id: warehouseId || null
          }
      });

      const metricsData = {
          total_products: totalProducts,
          total_variants: totalVariants,
          total_stock: totalStock,
          total_sales_today: totalSalesToday,
          total_purchases_today: totalPurchasesToday,
          low_stock_items: lowStockCount,
          calculated_at: new Date()
      };

      if (existing) {
          await tx.dashboardMetrics.update({
              where: { id: existing.id },
              data: metricsData
          });
      } else {
          await tx.dashboardMetrics.create({
              data: {
                  organization_id: organizationId,
                  warehouse_id: warehouseId || null,
                  ...metricsData
              }
          });
      }
    });
  }

  /**
   * Refreshes metrics for all organizations and their warehouses.
   */
  async refreshAllMetrics() {
    try {
        const orgs = await (prisma as any).organization.findMany({ select: { id: true } });
        for (const org of orgs) {
            // Organization-wide metrics
            await this.calculateAndStoreMetrics(org.id);
            
            // Per-warehouse metrics
            const warehouses = await (prisma as any).warehouse.findMany({
                where: { organization_id: org.id },
                select: { id: true }
            });
            
            for (const wh of warehouses) {
                await this.calculateAndStoreMetrics(org.id, wh.id);
            }
        }
        if (this.shouldLog) {
          console.log(`[Metrics] Dashboard metrics refreshed at ${new Date().toISOString()}`);
        }
    } catch (error) {
        console.error("[Metrics] Failed to refresh dashboard metrics:", error);
    }
  }
}
