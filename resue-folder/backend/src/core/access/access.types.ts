/**
 * Access control types. Permissions are dot-separated strings (e.g. SALES.CREATE).
 */
export type Permission = string;

/** User context for permission checks. Role is typically UserRole (ADMIN | MANAGER | STAFF). */
export type AccessUser = {
  role: string;
};

/** Well-known permission codes. */
export const PermissionCode = {
  SALES_CREATE: "SALES.CREATE",
  SALES_VIEW: "SALES.VIEW",
  SALES_SUBMIT: "SALES.SUBMIT",
  PURCHASE_CREATE: "PURCHASE.CREATE",
  PURCHASE_APPROVE: "PURCHASE.APPROVE",
  PURCHASE_VIEW: "PURCHASE.VIEW",
  INVENTORY_TRANSFER: "INVENTORY.TRANSFER",
  INVENTORY_VIEW: "INVENTORY.VIEW",
  INVENTORY_ADJUST: "INVENTORY.ADJUST",
  REPORTS_VIEW: "REPORTS.VIEW",
} as const;

export type PermissionCodeValue = (typeof PermissionCode)[keyof typeof PermissionCode];
