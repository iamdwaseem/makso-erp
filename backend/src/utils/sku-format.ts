/**
 * Canonical auto-SKU segments:
 * - Product: 5 letters (name) + hyphen + 2 letters (sequence)
 * - Variant: 5 (name) + 3 (color) + 3 (size) + 2 (sequence), hyphen-separated
 */

/** A–Z only from label; pad with X on the right to exact length. */
export function lettersFromText(label: string, length: number): string {
  const letters = (label ?? "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, length);
  return letters.padEnd(length, "X");
}

/** A–Z0–9 only from label; pad with X on the right to exact length. */
export function alnumFromText(label: string, length: number): string {
  const chars = (label ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, length);
  return chars.padEnd(length, "X");
}

export function normalizeSizeToken(raw: string | null | undefined): string {
  const token = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return token.length > 0 ? token : "STD";
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Two-letter sequence: AA = 0, AB = 1, … ZZ = 675 */
export function encodeSeq2(n: number): string {
  const hi = Math.floor(n / 26) % 26;
  const lo = n % 26;
  return String.fromCharCode(65 + hi) + String.fromCharCode(65 + lo);
}

export function decodeSeq2(s: string): number {
  if (s.length !== 2 || !/^[A-Z]{2}$/.test(s)) return -1;
  return (s.charCodeAt(0) - 65) * 26 + (s.charCodeAt(1) - 65);
}

export function nextSeq2ForPattern(existingSkus: string[], pattern: RegExp): string {
  let max = -1;
  for (const sku of existingSkus) {
    const m = sku.match(pattern);
    if (m?.[1]) {
      const idx = decodeSeq2(m[1]);
      if (idx >= 0) max = Math.max(max, idx);
    }
  }
  return encodeSeq2(max + 1);
}
