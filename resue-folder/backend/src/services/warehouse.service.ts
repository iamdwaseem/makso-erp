import { WarehouseRepository } from "../repositories/warehouse.repository.js";
import prisma from "../lib/prisma.js";

export class WarehouseService {
  private warehouseRepository: WarehouseRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    this.warehouseRepository = new WarehouseRepository(
      prisma as any,
      organizationId,
      userId,
      userRole,
      allowedWarehouseIds
    );
  }

  async getAllWarehouses(opts?: { page?: number; limit?: number }) {
    return this.warehouseRepository.findAll(opts);
  }

  async getWarehouseById(id: string) {
    const warehouse = await this.warehouseRepository.findById(id);
    if (!warehouse) throw new Error("Warehouse not found");
    return warehouse;
  }

  async createWarehouse(data: {
    name: string;
    code: string;
    location?: string;
  }) {
    return this.warehouseRepository.create(data);
  }

  async updateWarehouse(
    id: string,
    data: Partial<{ name: string; code: string; location: string }>
  ) {
    await this.getWarehouseById(id);
    return this.warehouseRepository.update(id, data);
  }

  async deleteWarehouse(id: string) {
    await this.getWarehouseById(id);
    return this.warehouseRepository.delete(id);
  }
}
