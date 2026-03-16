import prisma from "../lib/prisma.js";
import { GdnRepository } from "../repositories/gdn.repository.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { WarehouseRepository } from "../repositories/warehouse.repository.js";
import { CreateGdnInput, UpdateGdnInput } from "../validators/gdn.validator.js";

export class GdnService {
  private gdnRepo: GdnRepository;
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
    this.gdnRepo = new GdnRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.inventoryRepo = new InventoryRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.variantRepo = new VariantRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.warehouseRepo = new WarehouseRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAll(opts?: { page?: number; limit?: number }) {
    return this.gdnRepo.findAll(opts);
  }

  async getById(id: string) {
    const gdn = await this.gdnRepo.findById(id);
    if (!gdn) throw new Error("GDN not found");
    return gdn;
  }

  async create(data: CreateGdnInput) {
    const warehouse = await this.warehouseRepo.findById(data.warehouse_id);
    if (!warehouse) throw new Error("Warehouse not found");
    for (const item of data.items) {
      const variant = await this.variantRepo.findById(item.variant_id);
      if (!variant) throw new Error(`Variant not found: ${item.variant_id}`);
    }
    return this.gdnRepo.create(data);
  }

  async update(id: string, data: UpdateGdnInput) {
    const gdn = await this.getById(id);
    if (gdn.status !== "DRAFT") throw new Error("GDN can only be updated when status is DRAFT");
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
    const updated = await this.gdnRepo.update(id, data);
    if (!updated) throw new Error("GDN not found");
    return updated;
  }

  async submit(id: string) {
    const gdn = await this.getById(id);
    if (gdn.status !== "DRAFT") throw new Error("GDN can only be submitted when status is DRAFT");

    await (prisma as any).$transaction(async (tx: any) => {
      const orgId = (this.gdnRepo as any).organizationId;
      const invRepo = new InventoryRepository(tx, orgId, undefined, undefined, (this.gdnRepo as any).allowedWarehouseIds);
      for (const item of gdn.items) {
        await invRepo.applyStockChange(
          {
            variant_id: item.variant_id,
            warehouse_id: gdn.warehouse_id,
            quantity_delta: -item.quantity,
            type: "GDN",
            reference_id: id,
          },
          tx
        );
      }
      await (tx as any).gdn.update({
        where: { id },
        data: { status: "SUBMITTED" },
      });
    });
    return this.getById(id);
  }

  async cancel(id: string) {
    const gdn = await this.getById(id);
    if (gdn.status !== "DRAFT" && gdn.status !== "SUBMITTED") {
      throw new Error("GDN can only be cancelled when status is DRAFT or SUBMITTED");
    }
    await this.gdnRepo.updateStatus(id, "CANCELLED");
    return this.getById(id);
  }
}
