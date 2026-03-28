import prisma from "../lib/prisma.js";
import { applyRlsSessionToTx } from "../lib/transaction-rls.js";
import { TransferRepository } from "../repositories/transfer.repository.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { WarehouseRepository } from "../repositories/warehouse.repository.js";
import { CreateTransferInput, UpdateTransferInput } from "../validators/transfer.validator.js";
import { AdjustInventoryInput } from "../validators/inventory.validator.js";

function mergeTransferItems(items: { variant_id: string; quantity: number }[]) {
  const map = new Map<string, number>();
  for (const i of items) {
    map.set(i.variant_id, (map.get(i.variant_id) ?? 0) + i.quantity);
  }
  return [...map.entries()].map(([variant_id, quantity]) => ({ variant_id, quantity }));
}

export class TransferService {
  private transferRepo: TransferRepository;
  private variantRepo: VariantRepository;
  private warehouseRepo: WarehouseRepository;
  private organizationId: string;
  private userRole?: string;
  private allowedWarehouseIds: string[];

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    const client = prisma as any;
    this.organizationId = organizationId;
    this.userRole = userRole;
    this.allowedWarehouseIds = allowedWarehouseIds;
    this.transferRepo = new TransferRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.variantRepo = new VariantRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.warehouseRepo = new WarehouseRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
  }

  /** List: non-admins only see transfers touching at least one assigned warehouse. */
  async getAll(opts?: { page?: number; limit?: number }) {
    return this.transferRepo.findAll(opts);
  }

  private assertCanViewTransfer(t: { source_warehouse_id: string; target_warehouse_id: string }) {
    if (this.userRole === "ADMIN") return;
    const ok =
      this.allowedWarehouseIds.includes(t.source_warehouse_id) ||
      this.allowedWarehouseIds.includes(t.target_warehouse_id);
    if (!ok) throw new Error("Transfer not found");
  }

  /** Create / submit / edit lines: user must be allowed on the source warehouse (stock leaves from here). */
  private assertCanActFromSource(sourceWarehouseId: string) {
    if (this.userRole === "ADMIN") return;
    if (!this.allowedWarehouseIds.includes(sourceWarehouseId)) {
      throw new Error("You are not allowed to transfer stock from this warehouse");
    }
  }

  async getById(id: string) {
    const transfer = await this.transferRepo.findById(id);
    if (!transfer) throw new Error("Transfer not found");
    this.assertCanViewTransfer(transfer);
    return transfer;
  }

  async create(data: CreateTransferInput) {
    const source = await this.warehouseRepo.findById(data.source_warehouse_id);
    const target = await this.warehouseRepo.findById(data.target_warehouse_id);
    if (!source) throw new Error("Source warehouse not found");
    if (!target) throw new Error("Target warehouse not found");
    this.assertCanActFromSource(data.source_warehouse_id);

    const items = mergeTransferItems(data.items);
    for (const item of items) {
      const variant = await this.variantRepo.findById(item.variant_id);
      if (!variant) throw new Error(`Variant not found: ${item.variant_id}`);
    }
    return this.transferRepo.create({ ...data, items });
  }

  async update(id: string, data: UpdateTransferInput) {
    const transfer = await this.transferRepo.findById(id);
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status !== "DRAFT") throw new Error("Transfer can only be updated when status is DRAFT");
    this.assertCanViewTransfer(transfer);
    this.assertCanActFromSource(transfer.source_warehouse_id);

    const nextSource = data.source_warehouse_id ?? transfer.source_warehouse_id;
    const nextTarget = data.target_warehouse_id ?? transfer.target_warehouse_id;
    if (nextSource === nextTarget) throw new Error("Source and target warehouse must be different");

    if (data.source_warehouse_id != null) {
      const wh = await this.warehouseRepo.findById(data.source_warehouse_id);
      if (!wh) throw new Error("Source warehouse not found");
      this.assertCanActFromSource(data.source_warehouse_id);
    }
    if (data.target_warehouse_id != null) {
      const wh = await this.warehouseRepo.findById(data.target_warehouse_id);
      if (!wh) throw new Error("Target warehouse not found");
    }

    let patch: UpdateTransferInput = { ...data };
    if (data.items != null) {
      const merged = mergeTransferItems(data.items);
      for (const item of merged) {
        const variant = await this.variantRepo.findById(item.variant_id);
        if (!variant) throw new Error(`Variant not found: ${item.variant_id}`);
      }
      patch = { ...patch, items: merged };
    }

    const updated = await this.transferRepo.update(id, patch);
    if (!updated) throw new Error("Transfer not found");
    return updated;
  }

  async submit(id: string) {
    const transfer = await this.transferRepo.findById(id);
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status !== "DRAFT") throw new Error("Transfer can only be submitted when status is DRAFT");
    this.assertCanViewTransfer(transfer);
    this.assertCanActFromSource(transfer.source_warehouse_id);

    const lines = transfer.items as { variant_id: string; quantity: number }[];
    if (!lines?.length) throw new Error("Transfer has no line items");

    for (const item of lines) {
      const variant = await this.variantRepo.findById(item.variant_id);
      if (!variant) throw new Error(`Variant not found: ${item.variant_id}`);
    }

    await (prisma as any).$transaction(async (tx: any) => {
      await applyRlsSessionToTx(tx);
      const invRepo = new InventoryRepository(
        tx,
        this.organizationId,
        undefined,
        undefined,
        this.allowedWarehouseIds
      );

      for (const item of lines) {
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
