import prisma from "../lib/prisma.js";
import { PurchaseRepository } from "../repositories/purchase.repository.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { SupplierRepository } from "../repositories/supplier.repository.js";
import { WarehouseRepository } from "../repositories/warehouse.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { CreatePurchaseInput, UpdatePurchaseInput } from "../validators/purchase.validator.js";

export class PurchaseService {
  private purchaseRepo: PurchaseRepository;
  private inventoryRepo: InventoryRepository;
  private supplierRepo: SupplierRepository;
  private warehouseRepo: WarehouseRepository;
  private variantRepo: VariantRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    const client = prisma as any;
    this.purchaseRepo = new PurchaseRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.inventoryRepo = new InventoryRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.supplierRepo = new SupplierRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.warehouseRepo = new WarehouseRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.variantRepo = new VariantRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAll(opts?: { page?: number; limit?: number }) {
    return this.purchaseRepo.findAll(opts);
  }

  async getById(id: string) {
    const purchase = await this.purchaseRepo.findById(id);
    if (!purchase) throw new Error("Purchase not found");
    return purchase;
  }

  async create(data: CreatePurchaseInput) {
    const supplier = await this.supplierRepo.findById(data.supplier_id);
    if (!supplier) throw new Error("Supplier not found");
    const warehouse = await this.warehouseRepo.findById(data.warehouse_id);
    if (!warehouse) throw new Error("Warehouse not found");
    for (const item of data.items) {
      const variant = await this.variantRepo.findById(item.variant_id);
      if (!variant) throw new Error(`Variant not found: ${item.variant_id}`);
    }
    return this.purchaseRepo.create(data);
  }

  async update(id: string, data: UpdatePurchaseInput) {
    const purchase = await this.getById(id);
    if (purchase.status !== "DRAFT") throw new Error("Purchase can only be updated when status is DRAFT");
    if (data.supplier_id) {
      const supplier = await this.supplierRepo.findById(data.supplier_id);
      if (!supplier) throw new Error("Supplier not found");
    }
    if (data.warehouse_id) {
      const warehouse = await this.warehouseRepo.findById(data.warehouse_id);
      if (!warehouse) throw new Error("Warehouse not found");
    }
    if (data.items) {
      for (const item of data.items) {
        const variant = await this.variantRepo.findById(item.variant_id);
        if (!variant) throw new Error(`Variant not found: ${item.variant_id}`);
      }
    }
    const updated = await this.purchaseRepo.update(id, data);
    if (!updated) throw new Error("Purchase not found");
    return updated;
  }

  async submit(id: string) {
    const purchase = await this.getById(id);
    if (purchase.status !== "DRAFT") throw new Error("Purchase can only be submitted when status is DRAFT");

    await (prisma as any).$transaction(async (tx: any) => {
      const orgId = (this.purchaseRepo as any).organizationId;
      const invRepo = new InventoryRepository(tx, orgId, undefined, undefined, (this.purchaseRepo as any).allowedWarehouseIds);
      for (const item of purchase.items) {
        await invRepo.applyStockChange(
          {
            variant_id: item.variant_id,
            warehouse_id: purchase.warehouse_id,
            quantity_delta: item.quantity,
            type: "PURCHASE",
            reference_id: id,
          },
          tx
        );
      }
      await (tx as any).purchase.update({
        where: { id },
        data: { status: "SUBMITTED" },
      });
    });
    return this.getById(id);
  }

  async cancel(id: string) {
    const purchase = await this.getById(id);
    if (purchase.status !== "DRAFT" && purchase.status !== "SUBMITTED") {
      throw new Error("Purchase can only be cancelled when status is DRAFT or SUBMITTED");
    }
    await this.purchaseRepo.updateStatus(id, "CANCELLED");
    return this.getById(id);
  }
}
