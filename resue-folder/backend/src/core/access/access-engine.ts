import type { AccessUser } from "./access.types.js";
import { getPermissionsForRole } from "./role-permission.service.js";

export function checkPermission(user: AccessUser, permission: string): boolean {
  const permissions = getPermissionsForRole(user.role);
  return permissions.includes(permission);
}

export function requirePermission(user: AccessUser, permission: string): void {
  if (!checkPermission(user, permission)) {
    throw new Error(`Forbidden: missing permission ${permission}`);
  }
}
