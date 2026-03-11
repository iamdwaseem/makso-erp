import { z } from "zod";

export const scanSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  warehouse_id: z.string().uuid("Invalid warehouse ID"),
  action: z.enum(["IN", "OUT"]),
  quantity: z.number().int().positive("Quantity must be positive"),
  station_id: z.string().uuid("Invalid station ID").optional(),
});

export type ScanInput = z.infer<typeof scanSchema>;
