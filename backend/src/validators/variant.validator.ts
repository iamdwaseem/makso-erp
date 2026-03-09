import { z } from "zod";

export const variantSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  color: z.string().min(1, "Color is required"),
  sku: z.string().optional(),
});

export type VariantInput = z.infer<typeof variantSchema>;
