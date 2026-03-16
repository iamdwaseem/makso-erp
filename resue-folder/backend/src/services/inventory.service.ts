import prisma from "../lib/prisma.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { AdjustInventoryInput } from "../validators/inventory.validator.js";

export class InventoryService {
  private inventoryRepo: InventoryRepository;
  private variantRepo: VariantRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    this.inventoryRepo = new InventoryRepository(
      prisma as any,
      organizationId,
      userId,
      userRole,
      allowedWarehouseIds
    );
    this.variantRepo = new VariantRepository(
      prisma as any,
      organizationId,
      userId,
      userRole,
      allowedWarehouseIds
    );
  }

  async getAllInventory(opts?: {
    page?: number;
    limit?: number;
    search?: string;
    productId?: string;
    warehouseId?: string;
  }) {
    return this.inventoryRepo.findAll(opts);
  }

  async getInventoryByVariantId(variantId: string, warehouseId?: string) {
    const variant = await this.variantRepo.findById(variantId);
    if (!variant) throw new Error("Variant not found");
    const inventory = await this.inventoryRepo.findByVariantId(variantId, warehouseId);
    if (!inventory) {
      return { variant_id: variantId, warehouse_id: warehouseId, quantity: 0, reserved: 0, variant };
    }
    return inventory;
  }

  async getLedgerByVariantId(variantId: string, warehouseId?: string) {
    const variant = await this.variantRepo.findById(variantId);
    if (!variant) throw new Error("Variant not found");
    return this.inventoryRepo.getLedgerByVariantId(variantId, warehouseId);
  }

  async adjustInventory(data: AdjustInventoryInput) {
    const variant = await this.variantRepo.findById(data.variant_id);
    if (!variant) throw new Error("Variant not found");

    const orgId = (this.inventoryRepo as any).organizationId;
    return (prisma as any).$transaction(async (tx: any) => {
      const adjustment = await tx.adjustment.create({
        data: {
          organization_id: orgId,
          warehouse_id: data.warehouse_id,
          variant_id: data.variant_id,
          quantity: data.quantity,
          reason: data.reason ?? null,
        },
      });

      const repo = new InventoryRepository(tx, orgId);
      const inventory = await repo.applyStockChange(
        {
          variant_id: data.variant_id,
          warehouse_id: data.warehouse_id,
          quantity_delta: data.quantity,
          type: "ADJUSTMENT",
          reference_id: adjustment.id,
        },
        tx
      );
      return { inventory, adjustment };
    });
  }
}
