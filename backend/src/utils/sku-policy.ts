/** Application-level SKU rules (DB column is TEXT; this caps abuse and keeps UX predictable). */
export const SKU_MAX_LENGTH = 256;

const SKU_PATTERN = /^[A-Z0-9-]+$/;

/**
 * Normalize and validate a client-supplied SKU (create/update body).
 * @throws Error with message prefix "Invalid SKU" on violation
 */
export function normalizeAndValidateSkuInput(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error("Invalid SKU: SKU cannot be empty");
  }
  const upper = trimmed.toUpperCase();
  if (upper.length > SKU_MAX_LENGTH) {
    throw new Error(`Invalid SKU: must be at most ${SKU_MAX_LENGTH} characters`);
  }
  if (!SKU_PATTERN.test(upper)) {
    throw new Error("Invalid SKU: only A–Z, 0–9, and hyphen (-) are allowed");
  }
  return upper;
}

/**
 * Ensures an auto-generated SKU satisfies the same canonical rules as manual input.
 * @throws Error if the string cannot be made valid without changing semantics (should be rare).
 */
export function assertGeneratedSkuFormat(sku: string): void {
  if (sku.length > SKU_MAX_LENGTH) {
    throw new Error("Invalid SKU: generated SKU exceeds maximum length");
  }
  if (!SKU_PATTERN.test(sku)) {
    throw new Error("Invalid SKU: generated SKU failed policy check");
  }
}
