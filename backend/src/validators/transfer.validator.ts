import { z } from "zod";

const transferItemSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createTransferSchema = z
  .object({
    source_warehouse_id: z.string().uuid(),
    target_warehouse_id: z.string().uuid(),
    items: z.array(transferItemSchema).min(1),
  })
  .refine((d) => d.source_warehouse_id !== d.target_warehouse_id, {
    message: "Source and target warehouse must be different",
    path: ["target_warehouse_id"],
  });

export const updateTransferSchema = z
  .object({
    source_warehouse_id: z.string().uuid().optional(),
    target_warehouse_id: z.string().uuid().optional(),
    items: z.array(transferItemSchema).min(1).optional(),
  })
  .refine(
    (d) => {
      if (d.source_warehouse_id != null && d.target_warehouse_id != null) {
        return d.source_warehouse_id !== d.target_warehouse_id;
      }
      return true;
    },
    { message: "Source and target warehouse must be different", path: ["target_warehouse_id"] }
  );

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;

