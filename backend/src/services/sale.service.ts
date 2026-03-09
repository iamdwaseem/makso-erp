import { SaleRepository } from "../repositories/sale.repository.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { SaleInput } from "../validators/sale.validator.js";

const saleRepository = new SaleRepository();
const customerRepository = new CustomerRepository();
const variantRepository = new VariantRepository();

export class SaleService {
  async getAllSales(opts?: { limit?: number; offset?: number }) {
    return saleRepository.findAll(opts);
  }

  async countSales() {
    return saleRepository.count();
  }

  async getSaleById(id: string) {
    const sale = await saleRepository.findById(id);
    if (!sale) {
      throw new Error("Sale not found");
    }
    return sale;
  }

  async createSale(data: SaleInput) {
    // Validate customer exists
    const customer = await customerRepository.findById(data.customer_id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Validate all variants exist
    for (const item of data.items) {
      const variant = await variantRepository.findById(item.variant_id);
      if (!variant) {
        throw new Error(`Variant not found: ${item.variant_id}`);
      }
    }

    // Orchestrate sale transaction deeply passing through to DB layer cleanly
    return saleRepository.createSale(data);
  }
}
