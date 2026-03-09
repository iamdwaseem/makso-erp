import { z } from "zod";

export const variantSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  color: z.string().min(1, "Color is required"),
  sku: z.string().min(1, "SKU is required"),
});

export type VariantInput = z.infer<typeof variantSchema>;
