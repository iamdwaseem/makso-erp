import prisma from "../lib/prisma.js";
import { ReportRepository } from "../repositories/report.repository.js";

export class ReportService {
  private repo: ReportRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    const client = prisma as any;
    this.repo = new ReportRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getStockReport(warehouseId?: string) {
    return this.repo.getStockReport(warehouseId);
  }

  async getLowStockReport(warehouseId?: string) {
    return this.repo.getLowStockReport(warehouseId);
  }

  async getTransactionsReport(params?: { from?: string; to?: string; warehouseId?: string; limit?: number }) {
    const from = params?.from ? new Date(params.from) : undefined;
    const to = params?.to ? new Date(params.to) : undefined;
    return this.repo.getTransactionsReport({ ...params, from, to });
  }

  async getSalesSummaryReport(params?: { from?: string; to?: string; warehouseId?: string }) {
    const from = params?.from ? new Date(params.from) : undefined;
    const to = params?.to ? new Date(params.to) : undefined;
    return this.repo.getSalesSummaryReport({ ...params, from, to });
  }

  async getInventoryValuationReport(warehouseId?: string) {
    return this.repo.getInventoryValuationReport(warehouseId);
  }

  async getCustomerAgingReport() {
    return this.repo.getCustomerAgingReport();
  }

  async getSupplierAgingReport() {
    return this.repo.getSupplierAgingReport();
  }

  async getInventoryMovementHistory(params?: { from?: string; to?: string; warehouseId?: string; limit?: number }) {
    const from = params?.from ? new Date(params.from) : undefined;
    const to = params?.to ? new Date(params.to) : undefined;
    return this.repo.getInventoryMovementHistory({ ...params, from, to });
  }
}
