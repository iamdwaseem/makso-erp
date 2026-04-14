import type { SkuHistoryReason } from "@prisma/client";
import prisma, { prismaBase } from "../lib/prisma.js";
import { applyRlsSessionToTx } from "../lib/transaction-rls.js";
import {
  hasExplicitSkuField,
  productNameCatalogChanged,
  variantColorCatalogChanged,
  variantSizeCatalogChanged,
} from "../utils/catalog-compare.js";
import { UpdateRequestRepository } from "../repositories/updateRequest.repository.js";
import { ProductService } from "./product.service.js";
import { VariantService } from "./variant.service.js";
import {
  productUpdateRequestChangesSchema,
  variantUpdateRequestChangesSchema,
} from "../validators/updateRequest.validator.js";

const REQUEST_ALREADY_PROCESSED = "Request already processed";

function assertHasChanges(obj: Record<string, unknown>): void {
  if (Object.keys(obj).length === 0) {
    throw new Error("No changes requested");
  }
}

function assertAdminOrManager(role: string | undefined): void {
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new Error("Forbidden: reviewer must be ADMIN or MANAGER");
  }
}

async function lockUpdateRequestRow(tx: any, requestId: string, organizationId: string): Promise<void> {
  await tx.$executeRawUnsafe(
    `SELECT 1 FROM update_requests WHERE id = $1::uuid AND organization_id = $2::uuid FOR UPDATE`,
    requestId,
    organizationId
  );
}

export class UpdateRequestService {
  private organizationId: string;
  private userId?: string;
  private userRole?: string;
  private allowedWarehouseIds: string[];

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    this.organizationId = organizationId;
    this.userId = userId;
    this.userRole = userRole;
    this.allowedWarehouseIds = allowedWarehouseIds;
  }

  private repo(tx?: any): UpdateRequestRepository {
    return new UpdateRequestRepository(tx ?? prisma, this.organizationId);
  }

  private dbClient(tx?: any): any {
    return tx ?? prisma;
  }

  private productService(tx?: any): ProductService {
    return new ProductService(
      this.organizationId,
      this.userId,
      this.userRole,
      this.allowedWarehouseIds,
      this.dbClient(tx)
    );
  }

  private variantService(tx?: any): VariantService {
    return new VariantService(
      this.organizationId,
      this.userId,
      this.userRole,
      this.allowedWarehouseIds,
      this.dbClient(tx)
    );
  }

  async submitProductUpdateRequest(productId: string, requesterId: string, rawChanges: unknown) {
    const parsed = productUpdateRequestChangesSchema.safeParse(rawChanges);
    if (!parsed.success) {
      throw new Error(`Invalid update payload: ${parsed.error.issues[0]?.message ?? "validation failed"}`);
    }
    const changes = parsed.data as Record<string, unknown>;
    assertHasChanges(changes);

    await this.productService().getProductById(productId);

    return this.repo().create({
      entity_type: "product",
      entity_id: productId,
      requested_changes: changes,
      requested_by: requesterId,
    });
  }

  async submitVariantUpdateRequest(variantId: string, requesterId: string, rawChanges: unknown) {
    const parsed = variantUpdateRequestChangesSchema.safeParse(rawChanges);
    if (!parsed.success) {
      throw new Error(`Invalid update payload: ${parsed.error.issues[0]?.message ?? "validation failed"}`);
    }
    const changes = parsed.data as Record<string, unknown>;
    assertHasChanges(changes);

    await this.variantService().getVariantById(variantId);

    return this.repo().create({
      entity_type: "variant",
      entity_id: variantId,
      requested_changes: changes,
      requested_by: requesterId,
    });
  }

  async listPending() {
    assertAdminOrManager(this.userRole);
    return this.repo().findPending();
  }

  async approve(requestId: string, reviewerId: string, reviewerRole: string | undefined) {
    assertAdminOrManager(reviewerRole);

    const txOptions = { maxWait: 10_000, timeout: 60_000 };

    return prismaBase.$transaction(
      async tx => {
      await applyRlsSessionToTx(tx);
      await lockUpdateRequestRow(tx, requestId, this.organizationId);

      const requestRepo = this.repo(tx);
      const row = await requestRepo.findById(requestId);
      if (!row) throw new Error("Update request not found");
      if (row.status !== "pending") {
        throw new Error(REQUEST_ALREADY_PROCESSED);
      }

      const ps = this.productService(tx);
      const vs = this.variantService(tx);

      if (row.entity_type === "product") {
        const parsed = productUpdateRequestChangesSchema.safeParse(row.requested_changes);
        if (!parsed.success) {
          throw new Error("Stored request payload is invalid");
        }
        const patch = parsed.data;
        assertHasChanges(patch as Record<string, unknown>);

        const before = await ps.getProductById(row.entity_id);
        await ps.applyProductPatch(row.entity_id, patch);

        const explicitSku = hasExplicitSkuField(patch);
        const nameChanged = productNameCatalogChanged(before.name, patch.name);
        if (!explicitSku && nameChanged) {
          await ps.regenerateProductSkuFromCurrentName(row.entity_id, "name_change");
          const variants = await vs.getVariantsByProductId(row.entity_id);
          for (const v of variants) {
            await vs.regenerateVariantSkuFromCatalog(v.id, "name_change");
          }
        }
      } else {
        const parsed = variantUpdateRequestChangesSchema.safeParse(row.requested_changes);
        if (!parsed.success) {
          throw new Error("Stored request payload is invalid");
        }
        const patch = parsed.data;
        assertHasChanges(patch as Record<string, unknown>);

        const before = await vs.getVariantById(row.entity_id);
        await vs.applyVariantPatch(row.entity_id, patch);

        const explicitSku = hasExplicitSkuField(patch);
        const colorChanged = variantColorCatalogChanged(before.color, patch.color);
        const sizeChanged = variantSizeCatalogChanged(before.size ?? "", patch);
        if (!explicitSku && (colorChanged || sizeChanged)) {
          const regenReason: SkuHistoryReason = colorChanged ? "color_change" : "size_change";
          await vs.regenerateVariantSkuFromCatalog(row.entity_id, regenReason);
        }
      }

      return requestRepo.updateStatus(requestId, "approved", reviewerId);
      },
      txOptions
    );
  }

  async reject(requestId: string, reviewerId: string, reviewerRole: string | undefined) {
    assertAdminOrManager(reviewerRole);

    const txOptions = { maxWait: 10_000, timeout: 60_000 };

    return prismaBase.$transaction(
      async tx => {
      await applyRlsSessionToTx(tx);
      await lockUpdateRequestRow(tx, requestId, this.organizationId);

      const requestRepo = this.repo(tx);
      const row = await requestRepo.findById(requestId);
      if (!row) throw new Error("Update request not found");
      if (row.status !== "pending") {
        throw new Error(REQUEST_ALREADY_PROCESSED);
      }

      return requestRepo.updateStatus(requestId, "rejected", reviewerId);
      },
      txOptions
    );
  }
}
