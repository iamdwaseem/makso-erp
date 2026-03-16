import { PrismaClient, Purchase, Prisma } from "@prisma/client";
import { PurchaseInput, PurchaseUpdateInput } from "../validators/purchase.validator.js";
import { InventoryRepository } from "./inventory.repository.js";
import crypto from "crypto";
import { BaseRepository } from "./BaseRepository.js";

function generateInvoiceNumber(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${date}-${suffix}`;
}

export class PurchaseRepository extends BaseRepository {
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

  async findAll({ page = 1, limit = 50 }: { page?: number; limit?: number } = {}) {
    return this.paginate<Purchase>(
      (this.prisma as any).purchase,
      this.tenantWhere({}),
      page,
      limit,
      {
        supplier: true,
        items: { include: { variant: { include: { product: true } } } },
      },
      { created_at: "desc" }
    );
  }

  async count(): Promise<number> {
    return (this.prisma as any).purchase.count({
      where: this.tenantWhere({}),
    });
  }

  async findById(id: string): Promise<Purchase | null> {
    return (this.prisma as any).purchase.findFirst({
      where: this.tenantWhere({ id }),
      include: {
        supplier: true,
        warehouse: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });
  }

  async createPurchase(data: PurchaseInput): Promise<Purchase> {
    // Note: this.prisma might already be a transaction client if injected as such
    const txFunc = async (tx: Prisma.TransactionClient) => {
      // Create a fresh inventory repo with the transaction client
      const txInventoryRepo = new InventoryRepository(tx, this.organizationId, this.userId, this.userRole, this.allowedWarehouseIds);

      // 1. Create purchase record
      const purchase = await tx.purchase.create({
        data: this.tenantData({
          supplier_id: data.supplier_id,
          warehouse_id: data.warehouse_id,
          invoice_number: data.invoice_number ?? generateInvoiceNumber("PUR"),
        }),
      });

      // 2. Create purchase_items
      for (const item of data.items) {
        await tx.purchaseItem.create({
          data: this.tenantData({
            purchase_id: purchase.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
          }),
        });

        // 3 & 4. Increase inventory & insert ledger entries
        await txInventoryRepo.adjustInventory(
          {
            variant_id: item.variant_id,
            warehouse_id: data.warehouse_id,
            action: "IN",
            quantity: item.quantity,
            reference_type: "PURCHASE",
            reference_id: purchase.id,
          },
          tx
        );
      }

      // Return fully loaded purchase
      return tx.purchase.findUnique({
        where: { id: purchase.id },
        include: {
          supplier: true,
          items: { include: { variant: { include: { product: true } } } },
        },
      }) as unknown as Purchase;
    };

    if ((this.prisma as any).$transaction) {
      return (this.prisma as PrismaClient).$transaction(txFunc);
    } else {
      return txFunc(this.prisma as Prisma.TransactionClient);
    }
  }

  async updatePurchase(id: string, data: PurchaseUpdateInput): Promise<Purchase | null> {
    const existing = await (this.prisma as any).purchase.findFirst({
      where: this.tenantWhere({ id }),
      include: { items: true },
    });
    if (!existing) return null;
    const warehouseId = existing.warehouse_id;

    const txFunc = async (tx: Prisma.TransactionClient) => {
      const txInventoryRepo = new InventoryRepository(tx, this.organizationId, this.userId, this.userRole, this.allowedWarehouseIds);
      const currentStatus = existing.status as string;
      const newStatus = data.status ?? currentStatus;

      if (data.items !== undefined) {
        if (currentStatus !== "CANCELLED") {
          for (const item of existing.items) {
            await txInventoryRepo.adjustInventory(
              {
                variant_id: item.variant_id,
                warehouse_id: warehouseId,
                action: "OUT",
                quantity: item.quantity,
                reference_type: "PURCHASE",
                reference_id: id,
              },
              tx
            );
          }
        }
        await (tx as any).purchaseItem.deleteMany({ where: { purchase_id: id } });
        for (const item of data.items) {
          await (tx as any).purchaseItem.create({
            data: this.tenantData({
              purchase_id: id,
              variant_id: item.variant_id,
              quantity: item.quantity,
            }),
          });
        }
        if (newStatus !== "CANCELLED") {
          for (const item of data.items) {
            await txInventoryRepo.adjustInventory(
              {
                variant_id: item.variant_id,
                warehouse_id: warehouseId,
                action: "IN",
                quantity: item.quantity,
                reference_type: "PURCHASE",
                reference_id: id,
              },
              tx
            );
          }
        }
      } else {
        if (newStatus === "CANCELLED" && currentStatus !== "CANCELLED") {
          for (const item of existing.items) {
            await txInventoryRepo.adjustInventory(
              {
                variant_id: item.variant_id,
                warehouse_id: warehouseId,
                action: "OUT",
                quantity: item.quantity,
                reference_type: "PURCHASE",
                reference_id: id,
              },
              tx
            );
          }
        } else if (newStatus !== "CANCELLED" && currentStatus === "CANCELLED") {
          for (const item of existing.items) {
            await txInventoryRepo.adjustInventory(
              {
                variant_id: item.variant_id,
                warehouse_id: warehouseId,
                action: "IN",
                quantity: item.quantity,
                reference_type: "PURCHASE",
                reference_id: id,
              },
              tx
            );
          }
        }
      }

      const updateData: Record<string, unknown> = {};
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.status !== undefined) updateData.status = data.status;
      if (Object.keys(updateData).length > 0) {
        await (tx as any).purchase.update({ where: { id }, data: updateData });
      }
    };

    if ((this.prisma as any).$transaction) {
      await (this.prisma as PrismaClient).$transaction(txFunc);
    } else {
      await txFunc(this.prisma as Prisma.TransactionClient);
    }
    return this.findById(id) as Promise<Purchase | null>;
  }

  async deletePurchase(id: string): Promise<void> {
    const existing = await (this.prisma as any).purchase.findFirst({
      where: this.tenantWhere({ id }),
      include: { items: true },
    });
    if (!existing) throw new Error("Purchase not found");
    if (existing.status === "CANCELLED") {
      await (this.prisma as any).purchase.delete({ where: { id } });
      return;
    }
    const warehouseId = existing.warehouse_id;
    const txFunc = async (tx: Prisma.TransactionClient) => {
      const txInventoryRepo = new InventoryRepository(tx, this.organizationId, this.userId, this.userRole, this.allowedWarehouseIds);
      for (const item of existing.items) {
        await txInventoryRepo.adjustInventory(
          {
            variant_id: item.variant_id,
            warehouse_id: warehouseId,
            action: "OUT",
            quantity: item.quantity,
            reference_type: "PURCHASE",
            reference_id: id,
          },
          tx
        );
      }
      await (tx as any).purchase.delete({ where: { id } });
    };
    if ((this.prisma as any).$transaction) {
      await (this.prisma as PrismaClient).$transaction(txFunc);
    } else {
      await txFunc(this.prisma as Prisma.TransactionClient);
    }
  }
}
