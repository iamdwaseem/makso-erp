import prisma from "../lib/prisma.js";
import { SalePaymentRepository } from "../repositories/sale-payment.repository.js";
import { SaleRepository } from "../repositories/sale.repository.js";
import { CreateSalePaymentInput } from "../validators/sale-payment.validator.js";

export class SalePaymentService {
  private paymentRepo: SalePaymentRepository;
  private saleRepo: SaleRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    const client = prisma as any;
    this.paymentRepo = new SalePaymentRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
    this.saleRepo = new SaleRepository(client, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getBySaleId(saleId: string) {
    const sale = await this.saleRepo.findById(saleId);
    if (!sale) throw new Error("Sale not found");
    return this.paymentRepo.findBySaleId(saleId);
  }

  async create(saleId: string, data: CreateSalePaymentInput) {
    const sale = await this.saleRepo.findById(saleId);
    if (!sale) throw new Error("Sale not found");
    const payment = await this.paymentRepo.create(saleId, data.amount);
    if (!payment) throw new Error("Sale not found");
    return payment;
  }

  async delete(saleId: string, paymentId: string) {
    const sale = await this.saleRepo.findById(saleId);
    if (!sale) throw new Error("Sale not found");
    const result = await this.paymentRepo.delete(saleId, paymentId);
    if (!result || (result as { count: number }).count === 0) throw new Error("Payment not found");
  }
}
