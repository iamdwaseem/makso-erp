import { PurchaseRepository } from "../repositories/purchase.repository.js";
import { SupplierRepository } from "../repositories/supplier.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { PurchaseInput } from "../validators/purchase.validator.js";

const purchaseRepository = new PurchaseRepository();
const supplierRepository = new SupplierRepository();
const variantRepository = new VariantRepository();

export class PurchaseService {
  async getAllPurchases() {
    return purchaseRepository.findAll();
  }

  async getPurchaseById(id: string) {
    const purchase = await purchaseRepository.findById(id);
    if (!purchase) {
      throw new Error("Purchase not found");
    }
    return purchase;
  }

  async createPurchase(data: PurchaseInput) {
    // Validate supplier exists
    const supplier = await supplierRepository.findById(data.supplier_id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Validate all variants exist
    for (const item of data.items) {
      const variant = await variantRepository.findById(item.variant_id);
      if (!variant) {
        throw new Error(`Variant not found: ${item.variant_id}`);
      }
    }

    // Orchestrate purchase transaction deeply passing through to DB layer cleanly
    return purchaseRepository.createPurchase(data);
  }
}
