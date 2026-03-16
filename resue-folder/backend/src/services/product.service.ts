import prisma from "../lib/prisma.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { ProductInput } from "../validators/product.validator.js";
import { VariantRepository } from "../repositories/variant.repository.js";

async function generateProductSku(
  name: string,
  organizationId: string
): Promise<string> {
  const asciiName = name.replace(/[^\x20-\x7E]/g, "").trim();
  const initials = (asciiName || "PRD")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("");
  const base = initials || "PRD";

  const existing = await (prisma as any).product.findMany({
    where: {
      organization_id: organizationId,
      sku: { startsWith: base },
      deleted_at: null,
    },
    select: { sku: true },
  });

  let counter = 1;
  const usedNumbers = new Set(
    existing.map((p: any) => {
      const match = p.sku.match(/-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
  );
  while (usedNumbers.has(counter)) counter++;

  return `${base}-${String(counter).padStart(3, "0")}`;
}

export class ProductService {
  private productRepository: ProductRepository;
  private variantRepository: VariantRepository;
  private organizationId: string;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    this.organizationId = organizationId;
    this.productRepository = new ProductRepository(
      prisma as any,
      organizationId,
      userId,
      userRole,
      allowedWarehouseIds
    );
    this.variantRepository = new VariantRepository(
      prisma as any,
      organizationId,
      userId,
      userRole,
      allowedWarehouseIds
    );
  }

  async getAllProducts(opts?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    return this.productRepository.findAll(opts);
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new Error("Product not found");
    return product;
  }

  async createProduct(data: ProductInput) {
    const sku =
      data.sku?.trim() ||
      (await generateProductSku(data.name, this.organizationId));
    const existingSku = await this.productRepository.findBySku(sku);
    if (existingSku) throw new Error("SKU already exists");
    return this.productRepository.create({ ...data, sku });
  }

  async updateProduct(id: string, data: Partial<ProductInput>) {
    const product = await this.getProductById(id);
    if (data.sku && data.sku !== product.sku) {
      const existingSku = await this.productRepository.findBySku(data.sku);
      if (existingSku) throw new Error("SKU already exists");
    }
    return this.productRepository.update(id, data);
  }

  async deleteProduct(id: string) {
    await this.getProductById(id);
    return this.productRepository.delete(id);
  }
}
