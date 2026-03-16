/**
 * Backend API client. Aligned with FINAL_BACKEND_API_SPEC.md.
 * Base path: /api. Tenant: x-organization-slug or JWT (Bearer).
 */
const getBaseUrl = () =>
  (typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || ""
    : process.env.NEXT_PUBLIC_API_URL || ""
  ).replace(/\/$/, "") || "http://localhost:4000";

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const slug = process.env.NEXT_PUBLIC_ORGANIZATION_SLUG;
  if (slug) headers["x-organization-slug"] = slug;
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/** Headers for requests that must not send Bearer (e.g. login) */
function getPublicHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const slug = process.env.NEXT_PUBLIC_ORGANIZATION_SLUG;
  if (slug) headers["x-organization-slug"] = slug;
  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...(options?.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Paginated list response from backend */
export type Paginated<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };

function paginated<T>(path: string, params?: Record<string, string | number | undefined>): Promise<Paginated<T>> {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.set(k, String(v));
    });
  }
  const q = sp.toString();
  return request<Paginated<T>>(`${path}${q ? `?${q}` : ""}`);
}

// --- Auth ---

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string | null;
    organizationSlug: string | null;
  };
};

export type MeResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string | null;
  organizationSlug: string | null;
  organizationName?: string | null;
};

/** POST /api/auth/login — no Bearer token; returns token and user. */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const url = `${getBaseUrl()}/api/auth/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: getPublicHeaders(),
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json() as Promise<LoginResponse>;
}

/** GET /api/auth/me — requires Bearer token. */
export function getMe(): Promise<MeResponse> {
  return request<MeResponse>("/api/auth/me");
}

/** Logout: clear token (and optional user) from localStorage. */
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

/** Dashboard stats (GET /api/dashboard/stats) */
export type DashboardStats = {
  totalSales: number;
  cashSales: number;
  creditSales: number;
  creditNotesCount: number;
  openSaleInvoices: number;
  openPurchaseInvoices: number;
  collection: number;
  expenseClaims: number;
  lowStockItems: number;
};

/** Sales/purchase trend (GET /api/dashboard/sales-purchase-trend) */
export type SalesPurchaseTrendPoint = { period: string; sales: number; purchases: number };

/** Stock in/out trend (GET /api/dashboard/stock-in-out-trend) */
export type StockInOutTrendPoint = { period: string; stockIn: number; stockOut: number };

/** Inventory trend (GET /api/dashboard/inventory/trend) */
export type InventoryTrendPoint = { period: string; value: number };

/** Item groups (GET /api/dashboard/inventory/item-groups) */
export type ItemGroupPoint = { name: string; value: number };

/** Gain/loss (GET /api/dashboard/inventory/gain-loss) */
export type GainLoss = { gain: number; loss: number };

/** Stock report (GET /api/reports/stock) */
export type StockReportRow = {
  product: string;
  variant: string;
  warehouse: string;
  quantity: number;
  value: number;
};

/** Low stock report (GET /api/reports/low-stock) */
export type LowStockRow = {
  variantId: string;
  product: string;
  variant: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
};

/** Inventory valuation (GET /api/reports/inventory-valuation) */
export type InventoryValuation = {
  totalValue: number;
  byWarehouse: { warehouse: string; value: number }[];
};

/** API entity types (match backend camelCase) */
export type ApiSupplier = { id: string; name: string; phone: string; email?: string; address?: string };

export const api = {
  getBaseUrl,

  async getDashboardStats(params?: { from?: string; to?: string; warehouseId?: string }) {
    const sp = new URLSearchParams();
    if (params?.from) sp.set("from", params.from);
    if (params?.to) sp.set("to", params.to);
    if (params?.warehouseId) sp.set("warehouseId", params.warehouseId);
    const q = sp.toString();
    return request<DashboardStats>(`/api/dashboard/stats${q ? `?${q}` : ""}`);
  },

  async getSalesPurchaseTrend(from: string, to: string, warehouseId?: string) {
    const sp = new URLSearchParams({ from, to });
    if (warehouseId) sp.set("warehouseId", warehouseId);
    return request<SalesPurchaseTrendPoint[]>(`/api/dashboard/sales-purchase-trend?${sp}`);
  },

  async getStockInOutTrend(from: string, to: string, warehouseId?: string) {
    const sp = new URLSearchParams({ from, to });
    if (warehouseId) sp.set("warehouseId", warehouseId);
    return request<StockInOutTrendPoint[]>(`/api/dashboard/stock-in-out-trend?${sp}`);
  },

  async getInventoryTrend(from: string, to: string, warehouseId?: string) {
    const sp = new URLSearchParams({ from, to });
    if (warehouseId) sp.set("warehouseId", warehouseId);
    return request<InventoryTrendPoint[]>(`/api/dashboard/inventory/trend?${sp}`);
  },

  async getEmployeeSales(params?: { from?: string; to?: string; warehouseId?: string }) {
    const sp = new URLSearchParams();
    if (params?.from) sp.set("from", params.from);
    if (params?.to) sp.set("to", params.to);
    if (params?.warehouseId) sp.set("warehouseId", params.warehouseId);
    const q = sp.toString();
    return request<{ employee: string; count: number; revenue: number }[]>(
      `/api/dashboard/employee-sales${q ? `?${q}` : ""}`
    );
  },

  async getInventoryItemGroups(warehouseId?: string) {
    const q = warehouseId ? `?warehouseId=${encodeURIComponent(warehouseId)}` : "";
    return request<ItemGroupPoint[]>(`/api/dashboard/inventory/item-groups${q}`);
  },

  async getInventoryGainLoss(warehouseId?: string) {
    const q = warehouseId ? `?warehouseId=${encodeURIComponent(warehouseId)}` : "";
    return request<GainLoss>(`/api/dashboard/inventory/gain-loss${q}`);
  },

  async getStockReport(warehouseId?: string) {
    const q = warehouseId ? `?warehouseId=${encodeURIComponent(warehouseId)}` : "";
    return request<StockReportRow[]>(`/api/reports/stock${q}`);
  },

  async getLowStockReport(warehouseId?: string) {
    const q = warehouseId ? `?warehouseId=${encodeURIComponent(warehouseId)}` : "";
    return request<LowStockRow[]>(`/api/reports/low-stock${q}`);
  },

  async getInventoryValuation(warehouseId?: string) {
    const q = warehouseId ? `?warehouseId=${encodeURIComponent(warehouseId)}` : "";
    return request<InventoryValuation>(`/api/reports/inventory-valuation${q}`);
  },

  async getSalesSummary(params?: { from?: string; to?: string; warehouseId?: string }) {
    const sp = new URLSearchParams();
    if (params?.from) sp.set("from", params.from);
    if (params?.to) sp.set("to", params.to);
    if (params?.warehouseId) sp.set("warehouseId", params.warehouseId);
    const q = sp.toString();
    return request<{ totalSales: number; totalRevenue: number }>(
      `/api/reports/sales-summary${q ? `?${q}` : ""}`
    );
  },

  async getReportingOverview(params?: { from?: string; to?: string; warehouseId?: string }) {
    const sp = new URLSearchParams();
    if (params?.from) sp.set("from", params.from);
    if (params?.to) sp.set("to", params.to);
    if (params?.warehouseId) sp.set("warehouseId", params.warehouseId);
    const q = sp.toString();
    return request<{
      stats: DashboardStats;
      salesSummary: { totalSales: number; totalRevenue: number };
      inventoryValuation: InventoryValuation;
    }>(`/api/reporting/overview${q ? `?${q}` : ""}`);
  },

  /** Warehouses: list (returns data array for compatibility) */
  async getWarehouses(params?: { page?: number; limit?: number }): Promise<{ id: string; name: string }[]> {
    const res = await paginated<{ id: string; name: string }>(
      "/api/warehouses",
      { page: params?.page ?? 1, limit: params?.limit ?? 100 }
    );
    return res?.data ?? [];
  },

  getWarehouseById(id: string) {
    return request<{ id: string; name: string; code?: string; location?: string }>(`/api/warehouses/${id}`);
  },

  createWarehouse(data: { name: string; code: string; location?: string }) {
    return request<{ id: string }>("/api/warehouses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateWarehouse(id: string, data: { name?: string; code?: string; location?: string }) {
    return request<{ id: string }>(`/api/warehouses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteWarehouse(id: string) {
    return request<void>(`/api/warehouses/${id}`, { method: "DELETE" });
  },

  // ——— Users (settings) ———
  async getUsers(): Promise<{ id: string; name: string; email: string; role: string; createdAt: string }[]> {
    const res = await request<{ data: { id: string; name: string; email: string; role: string; createdAt: string }[] }>("/api/users");
    return res?.data ?? [];
  },

  createUser(data: { name: string; email: string; password: string; role?: string }) {
    return request<{ id: string }>("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteUser(id: string) {
    return request<void>(`/api/users/${id}`, { method: "DELETE" });
  },

  // ——— Suppliers ———
  getSuppliers(params?: { page?: number; limit?: number; search?: string }) {
    return paginated<{ id: string; name: string; phone: string; email?: string; address?: string }>(
      "/api/suppliers",
      params as Record<string, string | number | undefined>
    );
  },

  getSupplierById(id: string) {
    return request<{ id: string; name: string; phone: string; email?: string; address?: string }>(`/api/suppliers/${id}`);
  },

  createSupplier(data: { name: string; phone: string; email?: string; address?: string }) {
    return request<{ id: string }>("/api/suppliers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateSupplier(id: string, data: { name?: string; phone?: string; email?: string; address?: string }) {
    return request<{ id: string }>(`/api/suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteSupplier(id: string) {
    return request<void>(`/api/suppliers/${id}`, { method: "DELETE" });
  },

  // ——— Customers ———
  getCustomers(params?: { page?: number; limit?: number; search?: string }) {
    return paginated<{ id: string; name: string; phone: string; email?: string; address?: string }>(
      "/api/customers",
      params as Record<string, string | number | undefined>
    );
  },

  getCustomerById(id: string) {
    return request<{ id: string; name: string; phone: string; email?: string; address?: string }>(`/api/customers/${id}`);
  },

  createCustomer(data: { name: string; phone: string; email?: string; address?: string }) {
    return request<{ id: string }>("/api/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateCustomer(id: string, data: { name?: string; phone?: string; email?: string; address?: string }) {
    return request<{ id: string }>(`/api/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteCustomer(id: string) {
    return request<void>(`/api/customers/${id}`, { method: "DELETE" });
  },

  // ——— Products ———
  getProducts(params?: { page?: number; limit?: number; search?: string }) {
    return paginated<{ id: string; name: string }>("/api/products", params as Record<string, string | number | undefined>);
  },

  getProductById(id: string) {
    return request<{ id: string; name: string }>(`/api/products/${id}`);
  },

  getVariantsByProductId(productId: string) {
    return request<{ id: string; sku: string; color?: string; productId?: string }[]>(`/api/products/${productId}/variants`);
  },

  createProduct(data: { name: string }) {
    return request<{ id: string }>("/api/products", { method: "POST", body: JSON.stringify(data) });
  },

  updateProduct(id: string, data: { name?: string }) {
    return request<{ id: string }>(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },

  deleteProduct(id: string) {
    return request<void>(`/api/products/${id}`, { method: "DELETE" });
  },

  // ——— Variants ———
  getVariants(params?: { page?: number; limit?: number; search?: string }) {
    return paginated<{ id: string; sku: string; color?: string; productId?: string; reorderLevel?: number; valuationRate?: number }>(
      "/api/variants",
      params as Record<string, string | number | undefined>
    );
  },

  getVariantById(id: string) {
    return request<{ id: string; sku: string; color?: string; productId?: string }>(`/api/variants/${id}`);
  },

  getVariantBySku(sku: string) {
    return request<{ id: string; sku: string; color?: string }>(`/api/variants/sku/${encodeURIComponent(sku)}`);
  },

  createVariant(data: { productId: string; sku?: string; color: string; reorderLevel?: number; valuationRate?: number }) {
    return request<{ id: string; sku?: string }>("/api/variants", { method: "POST", body: JSON.stringify(data) });
  },

  updateVariant(id: string, data: { sku?: string; color?: string; reorderLevel?: number; valuationRate?: number }) {
    return request<{ id: string }>(`/api/variants/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },

  deleteVariant(id: string) {
    return request<void>(`/api/variants/${id}`, { method: "DELETE" });
  },

  // ——— Purchases ———
  getPurchases(params?: { page?: number; limit?: number }) {
    return paginated<any>("/api/purchases", params as Record<string, string | number | undefined>);
  },

  getPurchaseById(id: string) {
    return request<any>(`/api/purchases/${id}`);
  },

  createPurchase(data: { supplierId: string; warehouseId: string; items: { variantId: string; quantity: number; cost?: number }[] }) {
    return request<any>("/api/purchases", { method: "POST", body: JSON.stringify(data) });
  },

  updatePurchase(id: string, data: { items?: { variantId: string; quantity: number; cost?: number }[] }) {
    return request<any>(`/api/purchases/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },

  submitPurchase(id: string) {
    return request<any>(`/api/purchases/${id}/submit`, { method: "POST" });
  },

  cancelPurchase(id: string) {
    return request<any>(`/api/purchases/${id}/cancel`, { method: "POST" });
  },

  // ——— Sales ———
  getSales(params?: { page?: number; limit?: number }) {
    return paginated<any>("/api/sales", params as Record<string, string | number | undefined>);
  },

  getSaleById(id: string) {
    return request<any>(`/api/sales/${id}`);
  },

  createSale(data: { customerId: string; warehouseId: string; items: { variantId: string; quantity: number; price?: number }[] }) {
    return request<any>("/api/sales", { method: "POST", body: JSON.stringify(data) });
  },

  updateSale(id: string, data: { items?: { variantId: string; quantity: number; price?: number }[] }) {
    return request<any>(`/api/sales/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },

  submitSale(id: string) {
    return request<any>(`/api/sales/${id}/submit`, { method: "POST" });
  },

  cancelSale(id: string) {
    return request<any>(`/api/sales/${id}/cancel`, { method: "POST" });
  },

  getSalePayments(saleId: string) {
    return request<any[]>(`/api/sales/${saleId}/payments`);
  },

  createSalePayment(saleId: string, data: { amount: number }) {
    return request<any>(`/api/sales/${saleId}/payments`, { method: "POST", body: JSON.stringify(data) });
  },

  deleteSalePayment(saleId: string, paymentId: string) {
    return request<void>(`/api/sales/${saleId}/payments/${paymentId}`, { method: "DELETE" });
  },

  getCreditNotes(params?: { page?: number; limit?: number }) {
    return paginated<any>("/api/sales/credit-notes", params as Record<string, string | number | undefined>);
  },

  createCreditNote(data: { saleId: string; amount?: number; reason?: string; items?: { variantId: string; quantity: number }[] }) {
    return request<any>("/api/sales/credit-notes", { method: "POST", body: JSON.stringify(data) });
  },

  submitCreditNote(id: string) {
    return request<any>(`/api/sales/credit-notes/${id}/submit`, { method: "POST" });
  },

  // ——— Inventory (list, adjust) ———
  getInventory(params?: {
    page?: number;
    limit?: number;
    search?: string;
    productId?: string;
    warehouseId?: string;
  }) {
    return paginated<any>("/api/inventory", params as Record<string, string | number | undefined>);
  },

  adjustInventory(data: { variantId: string; warehouseId: string; quantity: number; reason?: string }) {
    return request<any>("/api/inventory/adjust", { method: "POST", body: JSON.stringify(data) });
  },

  getInventoryByVariantId(variantId: string) {
    return request<any>(`/api/inventory/${variantId}`);
  },

  getLedgerByVariantId(variantId: string, warehouseId?: string) {
    const q = warehouseId ? `?warehouseId=${encodeURIComponent(warehouseId)}` : "";
    return request<any[]>(`/api/inventory/${variantId}/ledger${q}`);
  },

  // ——— GRN (receipt notes) ———
  getGrnList(params?: { page?: number; limit?: number }) {
    return paginated<any>("/api/inventory/grn", params as Record<string, string | number | undefined>);
  },

  getGrnById(id: string) {
    return request<any>(`/api/inventory/grn/${id}`);
  },

  createGrn(data: { warehouseId: string; supplierId?: string; items: { variantId: string; quantity: number }[] }) {
    return request<any>("/api/inventory/grn", { method: "POST", body: JSON.stringify(data) });
  },

  updateGrn(id: string, data: { items?: { variantId: string; quantity: number }[] }) {
    return request<any>(`/api/inventory/grn/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },

  submitGrn(id: string) {
    return request<any>(`/api/inventory/grn/${id}/submit`, { method: "POST" });
  },

  cancelGrn(id: string) {
    return request<any>(`/api/inventory/grn/${id}/cancel`, { method: "POST" });
  },

  // ——— GDN (delivery notes) ———
  getGdnList(params?: { page?: number; limit?: number }) {
    return paginated<any>("/api/inventory/gdn", params as Record<string, string | number | undefined>);
  },

  getGdnById(id: string) {
    return request<any>(`/api/inventory/gdn/${id}`);
  },

  createGdn(data: { warehouseId: string; customerId?: string; items: { variantId: string; quantity: number }[] }) {
    return request<any>("/api/inventory/gdn", { method: "POST", body: JSON.stringify(data) });
  },

  updateGdn(id: string, data: { items?: { variantId: string; quantity: number }[] }) {
    return request<any>(`/api/inventory/gdn/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },

  submitGdn(id: string) {
    return request<any>(`/api/inventory/gdn/${id}/submit`, { method: "POST" });
  },

  cancelGdn(id: string) {
    return request<any>(`/api/inventory/gdn/${id}/cancel`, { method: "POST" });
  },

  // ——— Transfers ———
  getTransfers(params?: { page?: number; limit?: number }) {
    return paginated<any>("/api/inventory/transfers", params as Record<string, string | number | undefined>);
  },

  getTransferById(id: string) {
    return request<any>(`/api/inventory/transfers/${id}`);
  },

  createTransfer(data: { sourceWarehouseId: string; targetWarehouseId: string; items: { variantId: string; quantity: number }[] }) {
    return request<any>("/api/inventory/transfers", { method: "POST", body: JSON.stringify(data) });
  },

  updateTransfer(id: string, data: { items?: { variantId: string; quantity: number }[] }) {
    return request<any>(`/api/inventory/transfers/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },

  submitTransfer(id: string) {
    return request<any>(`/api/inventory/transfers/${id}/submit`, { method: "POST" });
  },

  // ——— Adjustments ———
  getAdjustments(params?: { page?: number; limit?: number }) {
    return paginated<any>("/api/inventory/adjustments", params as Record<string, string | number | undefined>);
  },

  getAdjustmentById(id: string) {
    return request<any>(`/api/inventory/adjustments/${id}`);
  },

  createAdjustment(data: { warehouseId: string; variantId: string; quantity: number; reason?: string }) {
    return request<any>("/api/inventory/adjustments", { method: "POST", body: JSON.stringify(data) });
  },

  /** Bulk import products from scraped CSV (creates Product + one Variant per row) */
  importProducts(products: { name: string; category?: string; description?: string }[]) {
    return request<{ created: number; productIds: string[]; errors?: string[] }>("/api/inventory/import/products", {
      method: "POST",
      body: JSON.stringify({ products }),
    });
  },

  // ——— Reports ———
  getTransactions(params?: { from?: string; to?: string; warehouseId?: string; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.from) sp.set("from", params.from);
    if (params?.to) sp.set("to", params.to);
    if (params?.warehouseId) sp.set("warehouseId", params.warehouseId);
    if (params?.limit) sp.set("limit", String(params.limit));
    const q = sp.toString();
    return request<any[]>(`/api/reports/transactions${q ? `?${q}` : ""}`);
  },

  getCustomerAging() {
    return request<any[]>("/api/reports/customer-aging");
  },

  getSupplierAging() {
    return request<any[]>("/api/reports/supplier-aging");
  },

  getInventoryMovementHistory(params?: { from?: string; to?: string; warehouseId?: string; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.from) sp.set("from", params.from);
    if (params?.to) sp.set("to", params.to);
    if (params?.warehouseId) sp.set("warehouseId", params.warehouseId);
    if (params?.limit) sp.set("limit", String(params.limit));
    const q = sp.toString();
    return request<any[]>(`/api/reports/inventory-movement-history${q ? `?${q}` : ""}`);
  },
};
