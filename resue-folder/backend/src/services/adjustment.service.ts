import prisma from "../lib/prisma.js";
import { AdjustmentRepository } from "../repositories/adjustment.repository.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { CreateAdjustmentInput } from "../validators/adjustment.validator.js";

export class AdjustmentService {
  private adjustmentRepo: AdjustmentRepository;
  private inventoryRepo: InventoryRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    const client = prisma as any;
    this.adjustmentRepo = new AdjustmentRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.inventoryRepo = new InventoryRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAll(opts?: { page?: number; limit?: number }) {
    return this.adjustmentRepo.findAll(opts);
  }

  async getById(id: string) {
    const adjustment = await this.adjustmentRepo.findById(id);
    if (!adjustment) throw new Error("Adjustment not found");
    return adjustment;
  }

  async create(data: CreateAdjustmentInput) {
    const orgId = (this.adjustmentRepo as any).organizationId;
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
      const invRepo = new InventoryRepository(tx, orgId, undefined, undefined, (this.adjustmentRepo as any).allowedWarehouseIds);
      await invRepo.applyStockChange(
        {
          variant_id: data.variant_id,
          warehouse_id: data.warehouse_id,
          quantity_delta: data.quantity,
          type: "ADJUSTMENT",
          reference_id: adjustment.id,
        },
        tx
      );
      const adjRepo = new AdjustmentRepository(tx, orgId);
      return adjRepo.findById(adjustment.id);
    });
  }
}
