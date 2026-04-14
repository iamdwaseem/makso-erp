import { PrismaClient } from "@prisma/client";
import prisma from "../lib/prisma.js";

export class HistoryService {
  private prisma: PrismaClient;
  private organizationId: string;
  private allowedWarehouseIds: string[];

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    this.prisma = prisma as any;
    this.organizationId = organizationId;
    this.allowedWarehouseIds = allowedWarehouseIds;
  }

  private async getReferenceIdsByWarehouse(
    warehouseId: string,
    referenceType: "PURCHASE" | "SALE"
  ): Promise<string[]> {
    const rows = await this.prisma.inventoryLedger.findMany({
      where: {
        organization_id: this.organizationId,
        warehouse_id: warehouseId,
        reference_type: referenceType
      },
      select: { reference_id: true },
      distinct: ["reference_id"]
    });
    return rows.map((r: any) => r.reference_id);
  }

  private buildDateRange(opts: {
    period?: "day" | "week" | "month" | "year" | "all" | "custom";
    startDate?: string;
    endDate?: string;
  }): { start?: Date; end?: Date } {
    const period = opts.period || "all";
    if (period === "all") return {};

    if (period === "custom") {
      if (!opts.startDate || !opts.endDate) return {};
      const start = new Date(`${opts.startDate}T00:00:00.000`);
      const end = new Date(`${opts.endDate}T23:59:59.999`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return {};
      return { start, end };
    }

    const now = new Date();
    let start = new Date(now);
    const end = now;

    if (period === "day") {
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }

    if (period === "week") {
      const day = start.getDay();
      const diffToMonday = (day + 6) % 7;
      start.setDate(start.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }

    if (period === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }

    start = new Date(now.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  private buildPurchaseDateWhere(start?: Date, end?: Date) {
    if (!start || !end) return undefined;
    return { purchase_date: { gte: start, lte: end } };
  }

  private buildSaleDateWhere(start?: Date, end?: Date) {
    if (!start || !end) return undefined;
    return { sale_date: { gte: start, lte: end } };
  }

  async getUnifiedHistory(opts: {
    page: number;
    limit: number;
    type?: "entry" | "exit";
    warehouseId?: string;
    period?: "day" | "week" | "month" | "year" | "all" | "custom";
    startDate?: string;
    endDate?: string;
  }) {
    const skip = (opts.page - 1) * opts.limit;
    const take = opts.limit;
    const warehouseId = opts.warehouseId && opts.warehouseId !== "all" ? opts.warehouseId : undefined;
    const { start, end } = this.buildDateRange(opts);

    let purchaseWhere: any = { organization_id: this.organizationId, deleted_at: null };
    let saleWhere: any = { organization_id: this.organizationId, deleted_at: null };
    const purchaseDateWhere = this.buildPurchaseDateWhere(start, end);
    const saleDateWhere = this.buildSaleDateWhere(start, end);
    if (purchaseDateWhere) purchaseWhere = { ...purchaseWhere, ...purchaseDateWhere };
    if (saleDateWhere) saleWhere = { ...saleWhere, ...saleDateWhere };

    if (warehouseId) {
      const [purchaseIds, saleIds] = await Promise.all([
        this.getReferenceIdsByWarehouse(warehouseId, "PURCHASE"),
        this.getReferenceIdsByWarehouse(warehouseId, "SALE")
      ]);
      purchaseWhere = { ...purchaseWhere, id: { in: purchaseIds.length ? purchaseIds : ["00000000-0000-0000-0000-000000000000"] } };
      saleWhere = { ...saleWhere, id: { in: saleIds.length ? saleIds : ["00000000-0000-0000-0000-000000000000"] } };
    }

    if (opts.type === "entry") {
      const [items, total] = await Promise.all([
        this.prisma.purchase.findMany({
          where: purchaseWhere,
          include: {
            supplier: true,
            items: { include: { variant: { include: { product: true } } } }
          },
          orderBy: { purchase_date: "desc" },
          skip,
          take
        }),
        this.prisma.purchase.count({ where: purchaseWhere })
      ]);

      return {
        data: items.map((p: any) => ({ ...p, type: "entry", date: p.purchase_date || p.created_at })),
        meta: {
          total,
          page: opts.page,
          limit: opts.limit,
          totalPages: Math.ceil(total / opts.limit)
        }
      };
    }

    if (opts.type === "exit") {
      const [items, total] = await Promise.all([
        this.prisma.sale.findMany({
          where: saleWhere,
          include: {
            customer: true,
            items: { include: { variant: { include: { product: true } } } }
          },
          orderBy: { sale_date: "desc" },
          skip,
          take
        }),
        this.prisma.sale.count({ where: saleWhere })
      ]);

      return {
        data: items.map((s: any) => ({ ...s, type: "exit", date: s.sale_date || s.created_at })),
        meta: {
          total,
          page: opts.page,
          limit: opts.limit,
          totalPages: Math.ceil(total / opts.limit)
        }
      };
    }

    const [purchaseTotal, saleTotal, purchaseItems, saleItems] = await Promise.all([
      this.prisma.purchase.count({ where: purchaseWhere }),
      this.prisma.sale.count({ where: saleWhere }),
      this.prisma.purchase.findMany({
        where: purchaseWhere,
        include: {
          supplier: true,
          items: { include: { variant: { include: { product: true } } } }
        },
        orderBy: { purchase_date: "desc" },
        take: skip + take
      }),
      this.prisma.sale.findMany({
        where: saleWhere,
        include: {
          customer: true,
          items: { include: { variant: { include: { product: true } } } }
        },
        orderBy: { sale_date: "desc" },
        take: skip + take
      })
    ]);

    const merged = [
      ...purchaseItems.map((p: any) => ({ ...p, type: "entry", date: p.purchase_date || p.created_at })),
      ...saleItems.map((s: any) => ({ ...s, type: "exit", date: s.sale_date || s.created_at }))
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const data = merged.slice(skip, skip + take);
    const total = purchaseTotal + saleTotal;

    return {
      data,
      meta: {
        total,
        page: opts.page,
        limit: opts.limit,
        totalPages: Math.ceil(total / opts.limit)
      }
    };
  }
}
