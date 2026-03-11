import { AsyncLocalStorage } from "async_hooks";

export interface TenantContext {
  organizationId: string;
  allowedWarehouseIds?: string[];
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext() {
  return tenantStorage.getStore();
}
