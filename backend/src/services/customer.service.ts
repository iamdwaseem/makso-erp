import { CustomerRepository } from "../repositories/customer.repository.js";
import { CustomerInput } from "../validators/customer.validator.js";

const customerRepository = new CustomerRepository();

export class CustomerService {
  async getAllCustomers() {
    return customerRepository.findAll();
  }

  async getCustomerById(id: string) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new Error("Customer not found");
    }
    return customer;
  }

  async createCustomer(data: CustomerInput) {
    return customerRepository.create(data);
  }

  async updateCustomer(id: string, data: Partial<CustomerInput>) {
    await this.getCustomerById(id); // Check existence
    return customerRepository.update(id, data);
  }

  async deleteCustomer(id: string) {
    await this.getCustomerById(id); // Check existence
    return customerRepository.delete(id);
  }
}
