import type { Product } from "@prisma/client";
import { Prisma, PrismaClient, SkuHistoryReason } from "@prisma/client";
import { ProductRepository } from "../repositories/product.repository.js";
import { ProductInput } from "../validators/product.validator.js";

import prisma, { prismaBase } from "../lib/prisma.js";
import { applyRlsSessionToTx } from "../lib/transaction-rls.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { VariantService } from "./variant.service.js";
import {
  createWithSkuRetry,
  isPrismaUniqueViolation,
  logSkuCollision,
  SKU_CREATE_MAX_ATTEMPTS,
} from "../utils/sku-create-retry.js";
import { assertGeneratedSkuFormat, normalizeAndValidateSkuInput } from "../utils/sku-policy.js";
import { hasExplicitSkuField, productNameCatalogChanged } from "../utils/catalog-compare.js";
import { recordSkuHistoryIfChanged } from "../utils/sku-history.js";
import { escapeRegex, lettersFromText, nextSeq2ForPattern } from "../utils/sku-format.js";

/**
 * Product auto-SKU: 5 letters from name + "-" + 2-letter sequence (AA, AB, …).
 */
async function generateProductSku(
  name: string,
  organizationId: string,
  db: PrismaClient | Prisma.TransactionClient = prisma as any
): Promise<string> {
  const name5 = lettersFromText(name, 5);
  const existing = await (db as any).product.findMany({
    where: {
      organization_id: organizationId,
      sku: { startsWith: `${name5}-` },
    },
    select: { sku: true },
  });
  const skus = existing.map((p: { sku: string }) => p.sku);
  const seqRe = new RegExp(`^${escapeRegex(name5)}-([A-Z]{2})$`);
  const seq = nextSeq2ForPattern(skus, seqRe);
  const sku = `${name5}-${seq}`;
  assertGeneratedSkuFormat(sku);
  return sku;
}

const TX_OPTS = { maxWait: 10_000, timeout: 60_000 };

export class ProductService {
  private productRepository: ProductRepository;
  private variantRepository: VariantRepository;
  private organizationId: string;
  private userId?: string;
  private userRole?: string;
  private allowedWarehouseIds: string[];
  private db: PrismaClient | Prisma.TransactionClient;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = [],
    db: PrismaClient | Prisma.TransactionClient = prisma as any
  ) {
    this.organizationId = organizationId;
    this.userId = userId;
    this.userRole = userRole;
    this.allowedWarehouseIds = allowedWarehouseIds;
    this.db = db;
    this.productRepository = new ProductRepository(db, organizationId, userId, userRole, allowedWarehouseIds);
    this.variantRepository = new VariantRepository(db, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAllProducts(opts?: { page?: number; limit?: number; search?: string }) {
    return this.productRepository.findAll(opts);
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new Error("Product not found");
    return product;
  }

  async createProduct(data: ProductInput) {
    const hasExplicitSku = data.sku !== undefined && data.sku.trim().length > 0;

    if (hasExplicitSku) {
      const sku = normalizeAndValidateSkuInput(data.sku as string);
      const existingSku = await this.productRepository.findBySku(sku);
      if (existingSku) throw new Error("SKU already exists");

      try {
        return await this.productRepository.create({ ...data, sku });
      } catch (error) {
        if (isPrismaUniqueViolation(error)) {
          logSkuCollision({
            organizationId: this.organizationId,
            entityType: "product",
            attemptedSku: sku,
            retryCount: 1,
          });
          throw new Error("SKU already exists");
        }
        throw error;
      }
    }

    const initialSku = await generateProductSku(data.name, this.organizationId, this.db);

    return createWithSkuRetry({
      organizationId: this.organizationId,
      entityType: "product",
      initialSku,
      generateNextSku: () => generateProductSku(data.name, this.organizationId, this.db),
      attemptCreate: sku => this.productRepository.create({ ...data, sku }),
    });
  }

  /**
   * Persist product fields only (no catalog SKU regeneration). Used by direct updates and approval flow.
   */
  async applyProductPatch(id: string, data: Partial<ProductInput>): Promise<Product> {
    const product = await this.getProductById(id);

    const patch: Partial<ProductInput> = { ...data };
    if (patch.sku !== undefined) {
      patch.sku = normalizeAndValidateSkuInput(patch.sku);
      if (patch.sku !== product.sku) {
        const existingSku = await this.productRepository.findBySku(patch.sku);
        if (existingSku) throw new Error("SKU already exists");
      }
    }

    const oldSku = product.sku;

    try {
      const updated = await this.productRepository.update(id, patch);
      if (patch.sku !== undefined && updated.sku !== oldSku) {
        await recordSkuHistoryIfChanged(this.db, {
          organization_id: this.organizationId,
          entity_type: "product",
          entity_id: id,
          old_sku: oldSku,
          new_sku: updated.sku,
          reason: "manual_override",
          changed_by: this.userId ?? null,
        });
      }
      return updated;
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        const attempted = patch.sku ?? product.sku;
        logSkuCollision({
          organizationId: this.organizationId,
          entityType: "product",
          attemptedSku: attempted,
          retryCount: 1,
        });
        throw new Error("SKU already exists");
      }
      throw error;
    }
  }

  async updateProduct(id: string, data: Partial<ProductInput>) {
    const product = await this.getProductById(id);

    const explicitSku = hasExplicitSkuField(data);
    const nameCatalogChange = productNameCatalogChanged(product.name, data.name);

    if (explicitSku || !nameCatalogChange) {
      return this.applyProductPatch(id, data);
    }

    return prismaBase.$transaction(
      async tx => {
        await applyRlsSessionToTx(tx);
        const ps = new ProductService(this.organizationId, this.userId, this.userRole, this.allowedWarehouseIds, tx);
        const vs = new VariantService(this.organizationId, this.userId, this.userRole, this.allowedWarehouseIds, tx);

        await ps.applyProductPatch(id, data);
        await ps.regenerateProductSkuFromCurrentName(id, "name_change");
        const variants = await vs.getVariantsByProductId(id);
        for (const v of variants) {
          await vs.regenerateVariantSkuFromCatalog(v.id, "name_change");
        }

        return ps.getProductById(id);
      },
      TX_OPTS
    );
  }

  async deleteProduct(id: string) {
    await this.getProductById(id);

    // Prevent deleting a product that still has live stock in the warehouse.
    const liveVariants = await this.variantRepository.findByProductId(id);
    const variantIds = liveVariants.map(v => v.id);

    const activeInventory = await (this.db as any).inventory.findMany({
      where: {
        organization_id: this.organizationId,
        variant_id: { in: variantIds },
        quantity: { gt: 0 },
      },
    });

    if (activeInventory.length > 0) {
      const totalUnits = activeInventory.reduce((sum: number, i: any) => sum + i.quantity, 0);
      throw new Error(
        `Cannot delete: product still has ${totalUnits} unit(s) in stock across ` +
          `${activeInventory.length} variant(s). ` +
          `Transfer or write-off the stock before deleting.`
      );
    }

    return this.productRepository.delete(id);
  }

  /**
   * Re-allocates product SKU from the current name (after catalog change). Used by update approval flow.
   */
  async regenerateProductSkuFromCurrentName(
    productId: string,
    reason: SkuHistoryReason = "name_change"
  ): Promise<void> {
    const product = await this.getProductById(productId);
    const oldSku = product.sku;
    let newSku = await generateProductSku(product.name, this.organizationId, this.db);

    for (let attempt = 1; attempt <= SKU_CREATE_MAX_ATTEMPTS; attempt++) {
      try {
        await this.productRepository.updateSku(productId, newSku);
        const after = await this.getProductById(productId);
        await recordSkuHistoryIfChanged(this.db, {
          organization_id: this.organizationId,
          entity_type: "product",
          entity_id: productId,
          old_sku: oldSku,
          new_sku: after.sku,
          reason,
          changed_by: this.userId ?? null,
        });
        return;
      } catch (error) {
        if (!isPrismaUniqueViolation(error)) throw error;
        logSkuCollision({
          organizationId: this.organizationId,
          entityType: "product",
          attemptedSku: newSku,
          retryCount: attempt,
        });
        if (attempt >= SKU_CREATE_MAX_ATTEMPTS) throw error;
        await new Promise<void>(resolve => {
          setTimeout(resolve, 12 * attempt);
        });
        newSku = await generateProductSku(product.name, this.organizationId, this.db);
      }
    }
  }
}
