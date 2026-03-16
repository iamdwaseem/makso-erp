import prisma from "../lib/prisma.js";
import { SaleRepository } from "../repositories/sale.repository.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { WarehouseRepository } from "../repositories/warehouse.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { CreateSaleInput, UpdateSaleInput } from "../validators/sale.validator.js";

export class SalesService {
  private saleRepo: SaleRepository;
  private inventoryRepo: InventoryRepository;
  private customerRepo: CustomerRepository;
  private warehouseRepo: WarehouseRepository;
  private variantRepo: VariantRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    const client = prisma as any;
    this.saleRepo = new SaleRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.inventoryRepo = new InventoryRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.customerRepo = new CustomerRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.warehouseRepo = new WarehouseRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.variantRepo = new VariantRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAll(opts?: { page?: number; limit?: number }) {
    return this.saleRepo.findAll(opts);
  }

  async getById(id: string) {
    const sale = await this.saleRepo.findById(id);
    if (!sale) throw new Error("Sale not found");
    return sale;
  }

  async create(data: CreateSaleInput) {
    const customer = await this.customerRepo.findById(data.customer_id);
    if (!customer) throw new Error("Customer not found");
    const warehouse = await this.warehouseRepo.findById(data.warehouse_id);
    if (!warehouse) throw new Error("Warehouse not found");
    for (const item of data.items) {
      const variant = await this.variantRepo.findById(item.variant_id);
      if (!variant) throw new Error(`Variant not found: ${item.variant_id}`);
    }
    return this.saleRepo.create(data);
  }

  async update(id: string, data: UpdateSaleInput) {
    const sale = await this.getById(id);
    if (sale.status !== "DRAFT") throw new Error("Sale can only be updated when status is DRAFT");
    if (data.customer_id) {
      const customer = await this.customerRepo.findById(data.customer_id);
      if (!customer) throw new Error("Customer not found");
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
    const updated = await this.saleRepo.update(id, data);
    if (!updated) throw new Error("Sale not found");
    return updated;
  }

  async submit(id: string) {
    const sale = await this.getById(id);
    if (sale.status !== "DRAFT") throw new Error("Sale can only be submitted when status is DRAFT");

    await (prisma as any).$transaction(async (tx: any) => {
      const orgId = (this.saleRepo as any).organizationId;
      const invRepo = new InventoryRepository(tx, orgId, undefined, undefined, (this.saleRepo as any).allowedWarehouseIds);
      for (const item of sale.items) {
        await invRepo.applyStockChange(
          {
            variant_id: item.variant_id,
            warehouse_id: sale.warehouse_id,
            quantity_delta: -item.quantity,
            type: "SALE",
            reference_id: id,
          },
          tx
        );
      }
      await (tx as any).sale.update({
        where: { id },
        data: { status: "SUBMITTED" },
      });
    });
    return this.getById(id);
  }

  async cancel(id: string) {
    const sale = await this.getById(id);
    if (sale.status !== "DRAFT" && sale.status !== "SUBMITTED") {
      throw new Error("Sale can only be cancelled when status is DRAFT or SUBMITTED");
    }
    await this.saleRepo.updateStatus(id, "CANCELLED");
    return this.getById(id);
  }
}
