import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
