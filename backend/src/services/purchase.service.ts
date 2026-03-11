import { PurchaseRepository } from "../repositories/purchase.repository.js";
import { SupplierRepository } from "../repositories/supplier.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { PurchaseInput } from "../validators/purchase.validator.js";
import prisma from "../lib/prisma.js";

export class PurchaseService {
  private purchaseRepository: PurchaseRepository;
  private supplierRepository: SupplierRepository;
  private variantRepository: VariantRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    this.purchaseRepository = new PurchaseRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
    this.supplierRepository = new SupplierRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
    this.variantRepository = new VariantRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAllPurchases(opts?: { page?: number; limit?: number }) {
    return this.purchaseRepository.findAll(opts);
  }

  async countPurchases() {
    return this.purchaseRepository.count();
  }

  async getPurchaseById(id: string) {
    const purchase = await this.purchaseRepository.findById(id);
    if (!purchase) {
      throw new Error("Purchase not found");
    }
    return purchase;
  }

  async createPurchase(data: PurchaseInput) {
    // Validate supplier exists
    const supplier = await this.supplierRepository.findById(data.supplier_id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Validate all variants exist
    for (const item of data.items) {
      const variant = await this.variantRepository.findById(item.variant_id);
      if (!variant) {
        throw new Error(`Variant not found: ${item.variant_id}`);
      }
    }

    // Orchestrate purchase transaction deeply passing through to DB layer cleanly
    return this.purchaseRepository.createPurchase(data);
  }
}
