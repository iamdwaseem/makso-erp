import { z } from "zod";

export const importProductRowSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().optional(),
  description: z.string().optional(),
});

export const importProductsSchema = z.object({
  products: z.array(importProductRowSchema).min(1, "At least one product is required").max(500),
});

export type ImportProductRow = z.infer<typeof importProductRowSchema>;
export type ImportProductsBody = z.infer<typeof importProductsSchema>;
