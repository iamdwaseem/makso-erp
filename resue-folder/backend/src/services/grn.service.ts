import prisma from "../lib/prisma.js";
import { GrnRepository } from "../repositories/grn.repository.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { WarehouseRepository } from "../repositories/warehouse.repository.js";
import { CreateGrnInput, UpdateGrnInput } from "../validators/grn.validator.js";

export class GrnService {
  private grnRepo: GrnRepository;
  private inventoryRepo: InventoryRepository;
  private variantRepo: VariantRepository;
  private warehouseRepo: WarehouseRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    const client = prisma as any;
    this.grnRepo = new GrnRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.inventoryRepo = new InventoryRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.variantRepo = new VariantRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.warehouseRepo = new WarehouseRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAll(opts?: { page?: number; limit?: number }) {
    return this.grnRepo.findAll(opts);
  }

  async getById(id: string) {
    const grn = await this.grnRepo.findById(id);
    if (!grn) throw new Error("GRN not found");
    return grn;
  }

  async create(data: CreateGrnInput) {
    const warehouse = await this.warehouseRepo.findById(data.warehouse_id);
    if (!warehouse) throw new Error("Warehouse not found");
    for (const item of data.items) {
      const variant = await this.variantRepo.findById(item.variant_id);
      if (!variant) throw new Error(`Variant not found: ${item.variant_id}`);
    }
    return this.grnRepo.create(data);
  }

  async update(id: string, data: UpdateGrnInput) {
    const grn = await this.getById(id);
    if (grn.status !== "DRAFT") throw new Error("GRN can only be updated when status is DRAFT");
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
    const updated = await this.grnRepo.update(id, data);
    if (!updated) throw new Error("GRN not found");
    return updated;
  }

  async submit(id: string) {
    const grn = await this.getById(id);
    if (grn.status !== "DRAFT") throw new Error("GRN can only be submitted when status is DRAFT");

    await (prisma as any).$transaction(async (tx: any) => {
      const orgId = (this.grnRepo as any).organizationId;
      const invRepo = new InventoryRepository(tx, orgId, undefined, undefined, (this.grnRepo as any).allowedWarehouseIds);
      for (const item of grn.items) {
        await invRepo.applyStockChange(
          {
            variant_id: item.variant_id,
            warehouse_id: grn.warehouse_id,
            quantity_delta: item.quantity,
            type: "GRN",
            reference_id: id,
          },
          tx
        );
      }
      await (tx as any).grn.update({
        where: { id },
        data: { status: "SUBMITTED" },
      });
    });
    return this.getById(id);
  }

  async cancel(id: string) {
    const grn = await this.getById(id);
    if (grn.status !== "DRAFT" && grn.status !== "SUBMITTED") {
      throw new Error("GRN can only be cancelled when status is DRAFT or SUBMITTED");
    }
    await this.grnRepo.updateStatus(id, "CANCELLED");
    return this.getById(id);
  }
}
