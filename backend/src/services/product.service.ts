import { ProductRepository } from "../repositories/product.repository.js";
import { ProductInput } from "../validators/product.validator.js";

const productRepository = new ProductRepository();

export class ProductService {
  async getAllProducts() {
    return productRepository.findAll();
  }

  async getProductById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }

  async createProduct(data: ProductInput) {
    // Ensure SKU is unique
    const existingSku = await productRepository.findBySku(data.sku);
    if (existingSku) {
      throw new Error("SKU already exists");
    }
    return productRepository.create(data);
  }

  async updateProduct(id: string, data: Partial<ProductInput>) {
    const product = await this.getProductById(id); // Check existence
    
    // Ensure new SKU is unique if provided and changed
    if (data.sku && data.sku !== product.sku) {
      const existingSku = await productRepository.findBySku(data.sku);
      if (existingSku) {
        throw new Error("SKU already exists");
      }
    }

    return productRepository.update(id, data);
  }

  async deleteProduct(id: string) {
    await this.getProductById(id); // Check existence
    return productRepository.delete(id);
  }
}
