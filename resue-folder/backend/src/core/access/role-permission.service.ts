import { PermissionCode } from "./access.types.js";

type Role = string;

const ALL_PERMISSIONS: string[] = [
  PermissionCode.SALES_CREATE,
  PermissionCode.SALES_VIEW,
  PermissionCode.SALES_SUBMIT,
  PermissionCode.PURCHASE_CREATE,
  PermissionCode.PURCHASE_APPROVE,
  PermissionCode.PURCHASE_VIEW,
  PermissionCode.INVENTORY_TRANSFER,
  PermissionCode.INVENTORY_VIEW,
  PermissionCode.INVENTORY_ADJUST,
  PermissionCode.REPORTS_VIEW,
];

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: [...ALL_PERMISSIONS],
  MANAGER: [...ALL_PERMISSIONS],
  STAFF: [
    PermissionCode.SALES_CREATE,
    PermissionCode.SALES_VIEW,
    PermissionCode.INVENTORY_VIEW,
    PermissionCode.REPORTS_VIEW,
  ],
};

export function getPermissionsForRole(role: Role): string[] {
  const list = ROLE_PERMISSIONS[role];
  if (list) return list;
  return [];
}
