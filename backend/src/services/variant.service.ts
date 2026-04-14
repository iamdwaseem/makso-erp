import type { Variant } from "@prisma/client";
import { Prisma, PrismaClient, SkuHistoryReason } from "@prisma/client";
import { VariantRepository } from "../repositories/variant.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { VariantInput } from "../validators/variant.validator.js";
import prisma, { prismaBase } from "../lib/prisma.js";
import { applyRlsSessionToTx } from "../lib/transaction-rls.js";
import {
  createWithSkuRetry,
  isPrismaUniqueViolation,
  logSkuCollision,
  SKU_CREATE_MAX_ATTEMPTS,
} from "../utils/sku-create-retry.js";
import { assertGeneratedSkuFormat, normalizeAndValidateSkuInput } from "../utils/sku-policy.js";
import {
  hasExplicitSkuField,
  variantColorCatalogChanged,
  variantSizeCatalogChanged,
} from "../utils/catalog-compare.js";
import { recordSkuHistoryIfChanged } from "../utils/sku-history.js";
import { escapeRegex, alnumFromText, nextSeq2ForPattern, normalizeSizeToken } from "../utils/sku-format.js";

/**
 * Variant auto-SKU:
 *   [PRODNAME-4]-[COLOR-3][PRODUCTCODE]-[SIZE]
 * If collisions happen, append a 2-letter sequence:
 *   [PRODNAME-4]-[COLOR-3][PRODUCTCODE]-[SIZE]-[AA]
 */
async function generateVariantSku(
  productId: string,
  color: string,
  organizationId: string,
  size: string | undefined,
  db: PrismaClient | Prisma.TransactionClient = prisma as any,
  excludeVariantId?: string
): Promise<string> {
  const productRepo = new ProductRepository(db, organizationId);
  const product = await productRepo.findById(productId);
  const name4 = alnumFromText(product?.name ?? "", 4);
  const color3 = alnumFromText(color, 3);
  const productCode = normalizeAndValidateSkuInput(product?.sku ?? "");
  const sizeToken = normalizeSizeToken(size);
  const base = `${name4}-${color3}${productCode}-${sizeToken}`;

  const where: Record<string, unknown> = {
    organization_id: organizationId,
    sku: { startsWith: base },
  };
  if (excludeVariantId) {
    where.id = { not: excludeVariantId };
  }

  const existing = await (db as any).variant.findMany({
    where,
    select: { sku: true },
  });
  const skus = existing.map((v: { sku: string }) => v.sku);
  const exactExists = skus.includes(base);
  if (!exactExists) {
    assertGeneratedSkuFormat(base);
    return base;
  }

  const seqRe = new RegExp(`^${escapeRegex(base)}-([A-Z]{2})$`);
  const seq = nextSeq2ForPattern(skus, seqRe);
  const sku = `${base}-${seq}`;
  assertGeneratedSkuFormat(sku);
  return sku;
}

const TX_OPTS = { maxWait: 10_000, timeout: 60_000 };

export class VariantService {
  private variantRepository: VariantRepository;
  private productRepository: ProductRepository;
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
    this.variantRepository = new VariantRepository(db, organizationId, userId, userRole, allowedWarehouseIds);
    this.productRepository = new ProductRepository(db, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAllVariants(opts?: { page?: number; limit?: number; search?: string }) {
    return this.variantRepository.findAll(opts);
  }

  async getVariantById(id: string) {
    const variant = await this.variantRepository.findById(id);
    if (!variant) throw new Error("Variant not found");
    return variant;
  }

  async getVariantsByProductId(productId: string) {
    return this.variantRepository.findByProductId(productId);
  }

  async getVariantBySku(sku: string) {
    const variant = await this.variantRepository.findBySku(sku);
    if (!variant) throw new Error("Variant not found");
    return variant;
  }

  async createVariant(data: VariantInput) {
    const hasExplicitSku = data.sku !== undefined && data.sku.trim().length > 0;

    if (hasExplicitSku) {
      const sku = normalizeAndValidateSkuInput(data.sku as string);
      const existingSku = await this.variantRepository.findBySku(sku);
      if (existingSku) throw new Error("SKU already exists");

      try {
        return await this.variantRepository.create({ ...data, sku });
      } catch (error) {
        if (isPrismaUniqueViolation(error)) {
          logSkuCollision({
            organizationId: this.organizationId,
            entityType: "variant",
            attemptedSku: sku,
            retryCount: 1,
          });
          throw new Error("SKU already exists");
        }
        throw error;
      }
    }

    const initialSku = await generateVariantSku(data.product_id, data.color, this.organizationId, data.size, this.db);

    return createWithSkuRetry({
      organizationId: this.organizationId,
      entityType: "variant",
      initialSku,
      generateNextSku: () => generateVariantSku(data.product_id, data.color, this.organizationId, data.size, this.db),
      attemptCreate: sku => this.variantRepository.create({ ...data, sku }),
    });
  }

  /**
   * Persist variant fields only (no catalog SKU regeneration). Used by direct updates and approval flow.
   */
  async applyVariantPatch(id: string, data: Partial<VariantInput>): Promise<Variant> {
    const variant = await this.getVariantById(id);

    const patch: Partial<VariantInput> = { ...data };
    if (patch.sku !== undefined) {
      patch.sku = normalizeAndValidateSkuInput(patch.sku);
      if (patch.sku !== variant.sku) {
        const existingSku = await this.variantRepository.findBySku(patch.sku);
        if (existingSku) throw new Error("SKU already exists");
      }
    }

    const oldSku = variant.sku;

    try {
      const updated = await this.variantRepository.update(id, patch);
      if (patch.sku !== undefined && updated.sku !== oldSku) {
        await recordSkuHistoryIfChanged(this.db, {
          organization_id: this.organizationId,
          entity_type: "variant",
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
        const attempted = patch.sku ?? variant.sku;
        logSkuCollision({
          organizationId: this.organizationId,
          entityType: "variant",
          attemptedSku: attempted,
          retryCount: 1,
        });
        throw new Error("SKU already exists");
      }
      throw error;
    }
  }

  async updateVariant(id: string, data: Partial<VariantInput>) {
    const variant = await this.getVariantById(id);

    const explicitSku = hasExplicitSkuField(data);
    const colorChanged = variantColorCatalogChanged(variant.color, data.color);
    const sizeChanged = variantSizeCatalogChanged(variant.size ?? "", data);

    if (explicitSku || (!colorChanged && !sizeChanged)) {
      return this.applyVariantPatch(id, data);
    }

    const regenReason: SkuHistoryReason = colorChanged ? "color_change" : "size_change";

    return prismaBase.$transaction(
      async tx => {
        await applyRlsSessionToTx(tx);
        const vs = new VariantService(this.organizationId, this.userId, this.userRole, this.allowedWarehouseIds, tx);
        await vs.applyVariantPatch(id, data);
        await vs.regenerateVariantSkuFromCatalog(id, regenReason);
        return vs.getVariantById(id);
      },
      TX_OPTS
    );
  }

  async deleteVariant(id: string) {
    await this.getVariantById(id);

    // SQL RLS handles the organization filter, but we explicitly check here for extra safety
    const inventory = await (this.db as any).inventory.findFirst({
      where: {
        organization_id: this.organizationId,
        variant_id: id,
        quantity: { gt: 0 },
      },
    });

    if (inventory) {
      throw new Error(
        `Cannot delete: variant still has ${inventory.quantity} unit(s) in stock. ` +
          `Write off or transfer the stock before deleting.`
      );
    }

    return this.variantRepository.delete(id);
  }

  /**
   * Re-allocates variant SKU from current color/size and product base SKU. Used by update approval flow.
   */
  async regenerateVariantSkuFromCatalog(variantId: string, reason: SkuHistoryReason): Promise<void> {
    const variant = await this.getVariantById(variantId);
    const oldSku = variant.sku;
    let newSku = await generateVariantSku(
      variant.product_id,
      variant.color,
      this.organizationId,
      variant.size,
      this.db,
      variantId
    );

    for (let attempt = 1; attempt <= SKU_CREATE_MAX_ATTEMPTS; attempt++) {
      try {
        await this.variantRepository.updateSku(variantId, newSku);
        const after = await this.getVariantById(variantId);
        await recordSkuHistoryIfChanged(this.db, {
          organization_id: this.organizationId,
          entity_type: "variant",
          entity_id: variantId,
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
          entityType: "variant",
          attemptedSku: newSku,
          retryCount: attempt,
        });
        if (attempt >= SKU_CREATE_MAX_ATTEMPTS) throw error;
        await new Promise<void>(resolve => {
          setTimeout(resolve, 12 * attempt);
        });
        newSku = await generateVariantSku(
          variant.product_id,
          variant.color,
          this.organizationId,
          variant.size,
          this.db,
          variantId
        );
      }
    }
  }
}
