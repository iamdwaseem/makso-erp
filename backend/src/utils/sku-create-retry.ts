import { Prisma } from "@prisma/client";

/** P2002 retries for auto-generated SKU (target 3–5 rounds; extra budget covers parallel bursts). */
export const SKU_CREATE_MAX_ATTEMPTS = 5;

export function isPrismaUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function logSkuCollision(params: {
  organizationId: string;
  entityType: "product" | "variant";
  attemptedSku: string;
  retryCount: number;
}): void {
  console.warn(
    `[SKU] unique_constraint_collision organization_id=${params.organizationId} entity=${params.entityType} attempted_sku=${params.attemptedSku} retry=${params.retryCount}`
  );
}

/**
 * Retries create when auto-generated SKU hits @@unique(organization_id, sku).
 * Does not change explicit/manual SKU behavior: caller should use a single attempt for those.
 */
export async function createWithSkuRetry<T>(params: {
  organizationId: string;
  entityType: "product" | "variant";
  initialSku: string;
  generateNextSku: () => Promise<string>;
  attemptCreate: (sku: string) => Promise<T>;
}): Promise<T> {
  let sku = params.initialSku;

  for (let attempt = 1; attempt <= SKU_CREATE_MAX_ATTEMPTS; attempt++) {
    try {
      return await params.attemptCreate(sku);
    } catch (error) {
      if (!isPrismaUniqueViolation(error)) {
        throw error;
      }

      logSkuCollision({
        organizationId: params.organizationId,
        entityType: params.entityType,
        attemptedSku: sku,
        retryCount: attempt,
      });

      if (attempt >= SKU_CREATE_MAX_ATTEMPTS) {
        throw error;
      }

      await new Promise<void>(resolve => {
        setTimeout(resolve, 12 * attempt);
      });
      sku = await params.generateNextSku();
    }
  }

  throw new Error("SKU create retry exhausted");
}
