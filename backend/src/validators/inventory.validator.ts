import { z } from "zod";

export const adjustInventorySchema = z.object({
  variant_id: z.string().uuid("Invalid variant ID"),
  action: z.enum(["IN", "OUT"]),
  quantity: z.number().int().positive("Quantity must be positive"),
  reference_type: z.string().min(1, "Reference type is required"),
  reference_id: z.string().uuid("Invalid reference ID"),
});

export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
