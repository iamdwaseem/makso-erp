export const FEATURE_FLAGS = {
  printInvoice: import.meta.env.VITE_ENABLE_PRINT_INVOICE === "true",
} as const;

