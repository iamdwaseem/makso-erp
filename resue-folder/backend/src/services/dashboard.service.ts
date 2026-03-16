import prisma from "../lib/prisma.js";
import { DashboardRepository } from "../repositories/dashboard.repository.js";

export class DashboardService {
  private repo: DashboardRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    const client = prisma as any;
    this.repo = new DashboardRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getStats(params?: { from?: string; to?: string; warehouseId?: string }) {
    const from = params?.from ? new Date(params.from) : undefined;
    const to = params?.to ? new Date(params.to) : undefined;
    const stats = await this.repo.getStats(from, to, params?.warehouseId);
    return {
      totalSales: stats.totalSales,
      cashSales: stats.cashSales,
      creditSales: stats.creditSales,
      creditNotesCount: stats.creditNotesCount,
      openSaleInvoices: stats.openSaleInvoices,
      openPurchaseInvoices: stats.openPurchaseInvoices,
      collection: stats.collection,
      expenseClaims: stats.expenseClaims,
      lowStockItems: stats.lowStockItems,
    };
  }

  async getSalesPurchaseTrend(from: string, to: string, warehouseId?: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return this.repo.getSalesPurchaseTrend(fromDate, toDate, warehouseId);
  }

  async getInventoryTrend(from: string, to: string, warehouseId?: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return this.repo.getInventoryTrend(fromDate, toDate, warehouseId);
  }

  async getEmployeeSales(params?: { from?: string; to?: string; warehouseId?: string }) {
    return this.repo.getEmployeeSales(
      params?.from ? new Date(params.from) : undefined,
      params?.to ? new Date(params.to) : undefined,
      params?.warehouseId
    );
  }

  async getItemGroups(warehouseId?: string) {
    return this.repo.getItemGroups(warehouseId);
  }

  async getStockInOutTrend(from: string, to: string, warehouseId?: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return this.repo.getStockInOutTrend(fromDate, toDate, warehouseId);
  }

  async getGainLoss(warehouseId?: string) {
    return this.repo.getGainLoss(warehouseId);
  }
}
