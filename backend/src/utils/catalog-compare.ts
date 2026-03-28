/** Trim + collapse internal whitespace for stable catalog comparisons. */
export function normalizeCatalogText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function productNameCatalogChanged(beforeName: string, nextName: string | undefined): boolean {
  if (nextName === undefined) return false;
  return normalizeCatalogText(nextName) !== normalizeCatalogText(beforeName);
}

export function variantColorCatalogChanged(beforeColor: string, nextColor: string | undefined): boolean {
  if (nextColor === undefined) return false;
  return normalizeCatalogText(nextColor) !== normalizeCatalogText(beforeColor);
}

export function variantSizeCatalogChanged(beforeSize: string, patch: { size?: string }): boolean {
  const before = (beforeSize ?? "").trim();
  if (patch.size === undefined) return false;
  const after = (patch.size ?? "").trim();
  return after !== before;
}

/** Request includes an explicit SKU field (override — no auto catalog regeneration). */
export function hasExplicitSkuField(patch: { sku?: string }): boolean {
  return patch.sku !== undefined;
}
