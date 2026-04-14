import { z } from "zod";
import { productSchema } from "./product.validator.js";
import { variantSchema } from "./variant.validator.js";

/** Strict partial: unknown keys rejected; same fields as product update. */
export const productUpdateRequestChangesSchema = productSchema.partial().strict();

/** Variant updates cannot move to another product via this workflow. */
export const variantUpdateRequestChangesSchema = variantSchema.omit({ product_id: true }).partial().strict();

export type ProductUpdateRequestChanges = z.infer<typeof productUpdateRequestChangesSchema>;
export type VariantUpdateRequestChanges = z.infer<typeof variantUpdateRequestChangesSchema>;
