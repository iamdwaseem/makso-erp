import { VariantRepository } from "../repositories/variant.repository.js";
import { VariantInput } from "../validators/variant.validator.js";

const variantRepository = new VariantRepository();

export class VariantService {
  async getAllVariants() {
    return variantRepository.findAll();
  }

  async getVariantById(id: string) {
    const variant = await variantRepository.findById(id);
    if (!variant) {
      throw new Error("Variant not found");
    }
    return variant;
  }

  async getVariantsByProductId(productId: string) {
    return variantRepository.findByProductId(productId);
  }

  async createVariant(data: VariantInput) {
    // Ensure SKU is unique
    const existingSku = await variantRepository.findBySku(data.sku);
    if (existingSku) {
      throw new Error("SKU already exists");
    }
    return variantRepository.create(data);
  }

  async updateVariant(id: string, data: Partial<VariantInput>) {
    const variant = await this.getVariantById(id); // Check existence
    
    // Ensure new SKU is unique if provided and changed
    if (data.sku && data.sku !== variant.sku) {
      const existingSku = await variantRepository.findBySku(data.sku);
      if (existingSku) {
        throw new Error("SKU already exists");
      }
    }

    return variantRepository.update(id, data);
  }

  async deleteVariant(id: string) {
    await this.getVariantById(id); // Check existence
    return variantRepository.delete(id);
  }
}
