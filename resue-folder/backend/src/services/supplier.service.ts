import { SupplierRepository } from "../repositories/supplier.repository.js";
import { SupplierInput } from "../validators/supplier.validator.js";
import prisma from "../lib/prisma.js";

export class SupplierService {
  private supplierRepository: SupplierRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    this.supplierRepository = new SupplierRepository(
      prisma as any,
      organizationId,
      userId,
      userRole,
      allowedWarehouseIds
    );
  }

  async getAllSuppliers(opts?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    return this.supplierRepository.findAll(opts);
  }

  async getSupplierById(id: string) {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier) throw new Error("Supplier not found");
    return supplier;
  }

  async createSupplier(data: SupplierInput) {
    return this.supplierRepository.create(data);
  }

  async updateSupplier(id: string, data: Partial<SupplierInput>) {
    await this.getSupplierById(id);
    return this.supplierRepository.update(id, data);
  }

  async deleteSupplier(id: string) {
    await this.getSupplierById(id);
    return this.supplierRepository.delete(id);
  }
}
