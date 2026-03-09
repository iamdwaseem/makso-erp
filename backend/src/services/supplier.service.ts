import { SupplierRepository } from "../repositories/supplier.repository.js";
import { SupplierInput } from "../validators/supplier.validator.js";

const supplierRepository = new SupplierRepository();

export class SupplierService {
  async getAllSuppliers() {
    return supplierRepository.findAll();
  }

  async getSupplierById(id: string) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }
    return supplier;
  }

  async createSupplier(data: SupplierInput) {
    return supplierRepository.create(data);
  }

  async updateSupplier(id: string, data: Partial<SupplierInput>) {
    await this.getSupplierById(id); // Check existence
    return supplierRepository.update(id, data);
  }

  async deleteSupplier(id: string) {
    await this.getSupplierById(id); // Check existence
    return supplierRepository.delete(id);
  }
}
