import { CustomerRepository } from "../repositories/customer.repository.js";
import { CustomerInput } from "../validators/customer.validator.js";
import prisma from "../lib/prisma.js";

export class CustomerService {
  private customerRepository: CustomerRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    this.customerRepository = new CustomerRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAllCustomers(opts?: { page?: number; limit?: number; search?: string }) {
    return this.customerRepository.findAll(opts);
  }

  async getCustomerById(id: string) {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new Error("Customer not found");
    }
    return customer;
  }

  async createCustomer(data: CustomerInput) {
    return this.customerRepository.create(data);
  }

  async updateCustomer(id: string, data: Partial<CustomerInput>) {
    await this.getCustomerById(id); // Check existence
    return this.customerRepository.update(id, data);
  }

  async deleteCustomer(id: string) {
    await this.getCustomerById(id); // Check existence
    return this.customerRepository.delete(id);
  }
}
