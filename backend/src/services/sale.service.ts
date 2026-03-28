import { SaleRepository } from "../repositories/sale.repository.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { SaleInput } from "../validators/sale.validator.js";
import prisma from "../lib/prisma.js";

export class SaleService {
  private saleRepository: SaleRepository;
  private customerRepository: CustomerRepository;
  private variantRepository: VariantRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    this.saleRepository = new SaleRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
    this.customerRepository = new CustomerRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
    this.variantRepository = new VariantRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAllSales(opts?: {
    page?: number;
    limit?: number;
    includeDeleted?: boolean;
    deletedOnly?: boolean;
  }) {
    return this.saleRepository.findAll(opts);
  }

  async countSales(opts?: { includeDeleted?: boolean; deletedOnly?: boolean }) {
    return this.saleRepository.count(opts);
  }

  async getSaleById(id: string, opts?: { includeDeleted?: boolean }) {
    const sale = await this.saleRepository.findById(id, opts);
    if (!sale) {
      throw new Error("Sale not found");
    }
    return sale;
  }

  async softDeleteSale(id: string, deletedByUserId: string | null) {
    return this.saleRepository.softDeleteSale(id, deletedByUserId);
  }

  async createSale(data: SaleInput) {
    // Validate customer exists
    const customer = await this.customerRepository.findById(data.customer_id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Validate all variants exist
    for (const item of data.items) {
      const variant = await this.variantRepository.findById(item.variant_id);
      if (!variant) {
        throw new Error(`Variant not found: ${item.variant_id}`);
      }
    }

    // Orchestrate sale transaction deeply passing through to DB layer cleanly
    return this.saleRepository.createSale(data);
  }
}
