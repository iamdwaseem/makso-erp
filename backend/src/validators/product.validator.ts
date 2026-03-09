import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  description: z.string().optional().or(z.literal("")),
});

export type ProductInput = z.infer<typeof productSchema>;
