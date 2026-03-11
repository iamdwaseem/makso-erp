import { PrismaClient } from "@prisma/client";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { AdjustInventoryInput } from "../validators/inventory.validator.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import prisma from "../lib/prisma.js";

export class InventoryService {
  private inventoryRepo: InventoryRepository;
  private variantRepo: VariantRepository;

  constructor(
    organizationId: string, 
    userId?: string, 
    userRole?: string, 
    allowedWarehouseIds: string[] = []
  ) {
    this.inventoryRepo = new InventoryRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
    this.variantRepo = new VariantRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAllInventory(opts?: { page?: number; limit?: number; search?: string; productId?: string; status?: string; warehouseId?: string }) {
    return this.inventoryRepo.findAll(opts);
  }

  async countInventory(search?: string, productId?: string, status?: string, warehouseId?: string) {
    return this.inventoryRepo.count(search, productId, status, warehouseId);
  }

  async getInventoryByVariantId(variantId: string, warehouseId?: string) {
    const variant = await this.variantRepo.findById(variantId);
    if (!variant) {
      throw new Error("Variant not found");
    }
    
    const inventory = await this.inventoryRepo.findByVariantId(variantId, warehouseId);
    if (!inventory) {
       return { variant_id: variantId, warehouse_id: warehouseId, quantity: 0, variant };
    }
    return inventory;
  }

  async adjustInventory(data: AdjustInventoryInput, txClient?: any) {
    const variant = await this.variantRepo.findById(data.variant_id);
    if (!variant) {
      throw new Error("Variant not found");
    }

    return this.inventoryRepo.adjustInventory(data, txClient);
  }

  async getLedgerByVariantId(variantId: string, warehouseId?: string) {
    const variant = await this.variantRepo.findById(variantId);
    if (!variant) {
      throw new Error("Variant not found");
    }
    return this.inventoryRepo.getLedgerByVariantId(variantId, warehouseId);
  }
}
