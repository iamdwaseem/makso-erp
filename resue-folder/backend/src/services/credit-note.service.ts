import prisma from "../lib/prisma.js";
import { CreditNoteRepository } from "../repositories/credit-note.repository.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { SaleRepository } from "../repositories/sale.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { CreateCreditNoteInput } from "../validators/credit-note.validator.js";

export class CreditNoteService {
  private creditNoteRepo: CreditNoteRepository;
  private inventoryRepo: InventoryRepository;
  private saleRepo: SaleRepository;
  private variantRepo: VariantRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    const client = prisma as any;
    this.creditNoteRepo = new CreditNoteRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.inventoryRepo = new InventoryRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.saleRepo = new SaleRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.variantRepo = new VariantRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAll(opts?: { page?: number; limit?: number }) {
    return this.creditNoteRepo.findAll(opts);
  }

  async getById(id: string) {
    const cn = await this.creditNoteRepo.findById(id);
    if (!cn) throw new Error("Credit note not found");
    return cn;
  }

  async create(data: CreateCreditNoteInput) {
    const sale = await this.saleRepo.findById(data.sale_id);
    if (!sale) throw new Error("Sale not found");
    for (const item of data.items) {
      const variant = await this.variantRepo.findById(item.variant_id);
      if (!variant) throw new Error(`Variant not found: ${item.variant_id}`);
    }
    return this.creditNoteRepo.create(data);
  }

  async submit(id: string) {
    const creditNote = await this.getById(id);
    if (creditNote.status !== "DRAFT") throw new Error("Credit note can only be submitted when status is DRAFT");
    const sale = await this.saleRepo.findById(creditNote.sale_id);
    if (!sale) throw new Error("Sale not found");

    await (prisma as any).$transaction(async (tx: any) => {
      const orgId = (this.creditNoteRepo as any).organizationId;
      const invRepo = new InventoryRepository(tx, orgId, undefined, undefined, (this.creditNoteRepo as any).allowedWarehouseIds);
      const warehouseId = sale.warehouse_id;
      for (const item of creditNote.items) {
        await invRepo.applyStockChange(
          {
            variant_id: item.variant_id,
            warehouse_id: warehouseId,
            quantity_delta: item.quantity,
            type: "CREDIT_NOTE",
            reference_id: id,
          },
          tx
        );
      }
      await (tx as any).creditNote.update({
        where: { id },
        data: { status: "SUBMITTED" },
      });
    });
    return this.getById(id);
  }
}
