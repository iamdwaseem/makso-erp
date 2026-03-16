import prisma from "../lib/prisma.js";
import { TransferRepository } from "../repositories/transfer.repository.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { WarehouseRepository } from "../repositories/warehouse.repository.js";
import { CreateTransferInput, UpdateTransferInput } from "../validators/transfer.validator.js";
import { AdjustInventoryInput } from "../validators/inventory.validator.js";

export class TransferService {
  private transferRepo: TransferRepository;
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
    this.transferRepo = new TransferRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.inventoryRepo = new InventoryRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.variantRepo = new VariantRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.warehouseRepo = new WarehouseRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAll(opts?: { page?: number; limit?: number }) {
    return this.transferRepo.findAll(opts);
  }

  async getById(id: string) {
    const transfer = await this.transferRepo.findById(id);
    if (!transfer) throw new Error("Transfer not found");
    return transfer;
  }

  async create(data: CreateTransferInput) {
    const source = await this.warehouseRepo.findById(data.source_warehouse_id);
    const target = await this.warehouseRepo.findById(data.target_warehouse_id);
    if (!source) throw new Error("Source warehouse not found");
    if (!target) throw new Error("Target warehouse not found");
    if (source.id === target.id) throw new Error("Source and target warehouse must be different");
    for (const item of data.items) {
      const variant = await this.variantRepo.findById(item.variant_id);
      if (!variant) throw new Error(`Variant not found: ${item.variant_id}`);
    }
    return this.transferRepo.create(data);
  }

  async update(id: string, data: UpdateTransferInput) {
    const transfer = await this.getById(id);
    if (transfer.status !== "DRAFT") throw new Error("Transfer can only be updated when status is DRAFT");
    if (data.items) {
      for (const item of data.items) {
        const variant = await this.variantRepo.findById(item.variant_id);
        if (!variant) throw new Error(`Variant not found: ${item.variant_id}`);
      }
    }
    const updated = await this.transferRepo.update(id, data);
    if (!updated) throw new Error("Transfer not found");
    return updated;
  }

  async submit(id: string) {
    const transfer = await this.getById(id);
    if (transfer.status !== "DRAFT") throw new Error("Transfer can only be submitted when status is DRAFT");

    await (prisma as any).$transaction(async (tx: any) => {
      const orgId = (this.transferRepo as any).organizationId;
      const invRepo = new InventoryRepository(tx, orgId, undefined, undefined, (this.transferRepo as any).allowedWarehouseIds);

      for (const item of transfer.items as any[]) {
        const outPayload: AdjustInventoryInput = {
          variant_id: item.variant_id,
          warehouse_id: transfer.source_warehouse_id,
          action: "OUT",
          quantity: item.quantity,
          reference_type: "TRANSFER_OUT",
          reference_id: id,
        };
        const inPayload: AdjustInventoryInput = {
          variant_id: item.variant_id,
          warehouse_id: transfer.target_warehouse_id,
          action: "IN",
          quantity: item.quantity,
          reference_type: "TRANSFER_IN",
          reference_id: id,
        };
        await invRepo.adjustInventory(outPayload, tx);
        await invRepo.adjustInventory(inPayload, tx);
      }

      await (tx as any).transfer.update({
        where: { id },
        data: { status: "SUBMITTED" },
      });
    });

    return this.getById(id);
  }
}

