import prisma from "../lib/prisma.js";
import { DashboardRepository } from "../repositories/dashboard.repository.js";
import { ReportRepository } from "../repositories/report.repository.js";

/** Reporting service: combined overview and report data for reporting UI */
export class ReportingService {
  private dashboardRepo: DashboardRepository;
  private reportRepo: ReportRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    const client = prisma as any;
    this.dashboardRepo = new DashboardRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.reportRepo = new ReportRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
  }

  /** Combined overview: stats + sales summary + inventory valuation */
  async getOverview(params?: { from?: string; to?: string; warehouseId?: string }) {
    const from = params?.from ? new Date(params.from) : undefined;
    const to = params?.to ? new Date(params.to) : undefined;
    const [stats, salesSummary, inventoryValuation] = await Promise.all([
      this.dashboardRepo.getStats(from, to, params?.warehouseId),
      this.reportRepo.getSalesSummaryReport({
        from,
        to,
        warehouseId: params?.warehouseId,
      }),
      this.reportRepo.getInventoryValuationReport(params?.warehouseId),
    ]);
    return {
      stats: {
        totalSales: stats.totalSales,
        cashSales: stats.cashSales,
        creditSales: stats.creditSales,
        creditNotesCount: stats.creditNotesCount,
        openSaleInvoices: stats.openSaleInvoices,
        openPurchaseInvoices: stats.openPurchaseInvoices,
        collection: stats.collection,
        expenseClaims: stats.expenseClaims,
        lowStockItems: stats.lowStockItems,
      },
      salesSummary,
      inventoryValuation,
    };
  }
}
