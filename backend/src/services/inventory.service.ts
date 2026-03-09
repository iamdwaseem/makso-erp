import { InventoryRepository } from "../repositories/inventory.repository.js";
import { AdjustInventoryInput } from "../validators/inventory.validator.js";
import { VariantRepository } from "../repositories/variant.repository.js";

const inventoryRepository = new InventoryRepository();
const variantRepository = new VariantRepository();

export class InventoryService {
  async getAllInventory(opts?: { limit?: number; offset?: number }) {
    return inventoryRepository.findAll(opts);
  }

  async countInventory() {
    return inventoryRepository.count();
  }

  async getInventoryByVariantId(variantId: string) {
    const variant = await variantRepository.findById(variantId);
    if (!variant) {
      throw new Error("Variant not found");
    }
    
    const inventory = await inventoryRepository.findByVariantId(variantId);
    if (!inventory) {
       // Return default object if no inventory movement has happened yet
       return { variant_id: variantId, quantity: 0, variant };
    }
    return inventory;
  }

  async adjustInventory(data: AdjustInventoryInput, txClient?: any) {
    // Validate variant exists first
    const variant = await variantRepository.findById(data.variant_id);
    if (!variant) {
      throw new Error("Variant not found");
    }

  // Handle transaction inside repository
    return inventoryRepository.adjustInventory(data, txClient);
  }

  async getLedgerByVariantId(variantId: string) {
    const variant = await variantRepository.findById(variantId);
    if (!variant) {
      throw new Error("Variant not found");
    }
    return inventoryRepository.getLedgerByVariantId(variantId);
  }
}
