"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "@/lib/api";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { useApi } from "@/hooks/useApi";

type StatusFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";
type ViewMode = "grid" | "table";

const LOW_STOCK_THRESHOLD = 10;

function statusOf(qty: number): StatusFilter {
  if (qty === 0) return "out_of_stock";
  if (qty < LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

const STATUS_LABELS: Record<StatusFilter, { label: string; cls: string }> = {
  all: { label: "All", cls: "" },
  in_stock: { label: "In Stock", cls: "bg-emerald-100 text-emerald-700" },
  low_stock: { label: "Low Stock", cls: "bg-amber-100 text-amber-700" },
  out_of_stock: { label: "Out of Stock", cls: "bg-red-100 text-red-700" },
};

const COLOR_DOTS: Record<string, string> = {
  black: "bg-gray-800",
  white: "bg-gray-100 border border-gray-300",
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  grey: "bg-gray-400",
  gray: "bg-gray-400",
  silver: "bg-slate-300 border border-slate-400",
  "midnight black": "bg-gray-900",
  "space grey": "bg-slate-400",
  "matte black": "bg-gray-900",
  "ivory white": "bg-amber-50 border border-amber-200",
  "midnight blue": "bg-indigo-700",
};

function colourDot(colour: string) {
  const key = (colour ?? "").toLowerCase();
  const cls = COLOR_DOTS[key] ?? "bg-violet-400";
  return <span className={`inline-block h-3 w-3 shrink-0 rounded-full ${cls}`} />;
}

/** Normalize API row (snake_case or camelCase) to a consistent shape */
type InventoryItem = {
  id: string;
  variantId: string;
  quantity: number;
  updatedAt: string;
  variant: {
    id: string;
    sku: string;
    color?: string;
    product?: { id: string; name: string };
    productId?: string;
  };
  warehouse?: { id: string; name: string };
  supplier?: { name: string } | null;
};

function normalizeItem(raw: any): InventoryItem {
  return {
    id: raw.id,
    variantId: raw.variant_id ?? raw.variantId,
    quantity: Number(raw.quantity ?? 0),
    updatedAt: raw.updated_at ?? raw.updatedAt ?? "",
    variant: {
      id: raw.variant?.id,
      sku: raw.variant?.sku ?? "",
      color: raw.variant?.color,
      product: raw.variant?.product ?? { id: raw.variant?.product_id, name: "" },
      productId: raw.variant?.productId ?? raw.variant?.product_id,
    },
    warehouse: raw.warehouse,
    supplier: raw.supplier ?? null,
  };
}

type LedgerEntry = {
  id: string;
  action: "IN" | "OUT";
  quantity: number;
  referenceType: string;
  referenceId: string;
  createdAt: string;
  balance?: number;
};

function normalizeLedgerEntry(raw: any): LedgerEntry {
  const typeVal = (raw.type ?? raw.action ?? "IN") as string;
  const action = typeVal === "OUT" ? "OUT" : "IN";
  return {
    id: raw.id,
    action,
    quantity: Number(raw.quantity ?? 0),
    referenceType: raw.reference_type ?? raw.referenceType ?? typeVal ?? "",
    referenceId: raw.reference_id ?? raw.referenceId ?? "",
    createdAt: raw.created_at ?? raw.createdAt ?? "",
  };
}

export default function InventoryItemsPage() {
  const { warehouseId, setWarehouseId } = useGlobalFilter();
  const [page, setPage] = useState(1);
  const limit = 50;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<ViewMode>("grid");

  const [qrSku, setQrSku] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: inventoryRes, loading, error, refetch } = useApi(
    () =>
      api.getInventory({
        page,
        limit,
        search: debouncedSearch || undefined,
        productId: productFilter !== "all" ? productFilter : undefined,
        warehouseId: warehouseId !== "all" ? warehouseId : undefined,
      }),
    [page, debouncedSearch, productFilter, warehouseId]
  );

  // If backend returns "Access to warehouse denied" (e.g. stale warehouse ID after reseed), reset to "all" so refetch succeeds
  useEffect(() => {
    if (error === "Access to warehouse denied") setWarehouseId("all");
  }, [error, setWarehouseId]);

  const rawData = (inventoryRes as { data?: any[] })?.data ?? [];
  const meta = (inventoryRes as { meta?: { total: number } })?.meta;
  const total = meta?.total ?? 0;
  const items: InventoryItem[] = useMemo(() => rawData.map(normalizeItem), [rawData]);

  const productOptions = useMemo(() => {
    const seen = new Map<string, string>();
    items.forEach((i) => {
      const id = i.variant?.product?.id ?? i.variant?.productId;
      const name = i.variant?.product?.name ?? "Product";
      if (id) seen.set(id, name);
    });
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const supplierOptions = useMemo(() => {
    const names = [...new Set(items.map((i) => i.supplier?.name).filter(Boolean) as string[])].sort();
    return names;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((item) => {
      if (q && !(item.variant?.product?.name?.toLowerCase().includes(q) || item.variant?.color?.toLowerCase().includes(q) || item.variant?.sku?.toLowerCase().includes(q) || (item.supplier?.name ?? "").toLowerCase().includes(q))) return false;
      if (productFilter !== "all" && (item.variant?.product?.id ?? item.variant?.productId) !== productFilter) return false;
      if (supplierFilter !== "all" && item.supplier?.name !== supplierFilter) return false;
      if (statusFilter !== "all" && statusOf(item.quantity) !== statusFilter) return false;
      return true;
    });
  }, [items, search, productFilter, supplierFilter, statusFilter]);

  const lowCountPage = filtered.filter((i) => statusOf(i.quantity) === "low_stock").length;
  const outCountPage = filtered.filter((i) => statusOf(i.quantity) === "out_of_stock").length;
  const totalUnits = filtered.reduce((s, i) => s + i.quantity, 0);

  const grouped = useMemo(() => {
    const map = new Map<string, { productName: string; items: InventoryItem[] }>();
    filtered.forEach((item) => {
      const pid = item.variant?.product?.id ?? item.variant?.productId ?? "";
      const productName = item.variant?.product?.name ?? "Product";
      if (!map.has(pid)) map.set(pid, { productName, items: [] });
      map.get(pid)!.items.push(item);
    });
    return Array.from(map.values()).sort((a, b) => a.productName.localeCompare(b.productName));
  }, [filtered]);

  const anyFilterActive = search !== "" || productFilter !== "all" || supplierFilter !== "all" || statusFilter !== "all";

  const resetFilters = useCallback(() => {
    setSearch("");
    setProductFilter("all");
    setSupplierFilter("all");
    setStatusFilter("all");
  }, []);

  const openLedger = useCallback((item: InventoryItem) => {
    setSelectedItem(item);
    setLedgerLoading(true);
    setLedger([]);
    api
      .getLedgerByVariantId(item.variantId, warehouseId !== "all" ? warehouseId : undefined)
      .then((raw: any) => setLedger(Array.isArray(raw) ? raw.map(normalizeLedgerEntry) : []))
      .catch(() => setLedger([]))
      .finally(() => setLedgerLoading(false));
  }, [warehouseId]);

  const ledgerWithBalance = useMemo(() => {
    const asc = [...ledger].reverse();
    let bal = 0;
    return asc.map((e) => {
      bal = e.action === "IN" ? bal + e.quantity : bal - e.quantity;
      return { ...e, balance: bal };
    }).reverse();
  }, [ledger]);

  const printQr = useCallback((sku: string) => {
    const el = document.getElementById("inv-qr-print-area");
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>QR - ${sku}</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:monospace;}p{font-size:18px;margin-top:12px;}</style></head><body>${el.outerHTML}<p>${sku}</p><script>window.print();window.close();</script></body></html>`
    );
    win.document.close();
  }, []);

  return (
    <div className="space-y-5 p-6">
      {/* Page title — match reference */}
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
      </div>

      {/* Summary cards — match reference: Total Units, Matches Found, Low Stock, Out of Stock */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-700 shadow-sm">
          <span className="text-3xl">📦</span>
          <div>
            <div className="text-2xl font-bold leading-tight">{totalUnits.toLocaleString()}</div>
            <div className="mt-1 text-sm font-semibold text-gray-700">Total Units</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-purple-100 bg-purple-50 p-5 text-purple-700 shadow-sm">
          <span className="text-3xl">🏷️</span>
          <div>
            <div className="text-2xl font-bold leading-tight">{total}</div>
            <div className="mt-1 text-sm font-semibold text-gray-700">Matches Found</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-amber-100 bg-amber-50 p-5 text-amber-700 shadow-sm">
          <span className="text-3xl">⚠️</span>
          <div>
            <div className="text-2xl font-bold leading-tight">{lowCountPage}</div>
            <div className="mt-1 text-sm font-semibold text-gray-700">Low Stock (Page)</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50 p-5 text-red-700 shadow-sm">
          <span className="text-3xl">🚫</span>
          <div>
            <div className="text-2xl font-bold leading-tight">{outCountPage}</div>
            <div className="mt-1 text-sm font-semibold text-gray-700">Out of Stock (Page)</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[180px] flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, colour, SKU..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Products</option>
            {productOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Suppliers</option>
            {supplierOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          {anyFilterActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 transition-colors hover:border-red-200 hover:text-red-500"
            >
              Reset
            </button>
          )}
          <div className="ml-auto flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              title="Grid view"
              className={`rounded-md p-1.5 transition-colors ${view === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              title="Table view"
              className={`rounded-md p-1.5 transition-colors ${view === "table" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Failed to load inventory</p>
          <p className="mt-1">{error}</p>
          <p className="mt-3 text-xs text-red-600">
            Check: (1) Backend running at {typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") : "NEXT_PUBLIC_API_URL"}?
            (2) If you use <code className="rounded bg-red-100 px-1">NEXT_PUBLIC_ORGANIZATION_SLUG</code>, it must match an organization in the backend DB, or remove it in dev.
            (3) Log in again if the token expired.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-sm text-gray-400">Loading inventory…</div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center text-sm text-gray-400">
          No items match the current filters.{" "}
          {anyFilterActive && (
            <button type="button" onClick={resetFilters} className="text-blue-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {grouped.map((group) => {
            const hasAlert = group.items.some((i) => statusOf(i.quantity) !== "in_stock");
            const totalGroupUnits = group.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <div
                key={group.productName}
                className={`overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md ${hasAlert ? "border-amber-200" : "border-gray-100"} bg-white`}
              >
                <div className={`flex items-center justify-between border-b px-5 py-4 ${hasAlert ? "border-amber-100 bg-amber-50" : "border-gray-100 bg-gray-50"}`}>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{group.productName}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {group.items.length} variant{group.items.length !== 1 ? "s" : ""} · {totalGroupUnits} units
                    </p>
                  </div>
                  {hasAlert && <span className="text-xl text-amber-500" title="Low or out of stock">⚠️</span>}
                </div>
                <div className="divide-y divide-gray-100">
                  {group.items.map((item) => {
                    const st = statusOf(item.quantity);
                    const { label, cls } = STATUS_LABELS[st];
                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openLedger(item)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLedger(item); } }}
                        className="group flex w-full cursor-pointer items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-blue-50/80"
                      >
                        {colourDot(item.variant?.color ?? "")}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{item.variant?.color ?? "—"}</span>
                            <span className="text-xs font-mono text-gray-500">{item.variant?.sku}</span>
                          </div>
                          {item.supplier && (
                            <p className="mt-0.5 truncate text-xs text-gray-500">{item.supplier.name}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-base font-bold text-gray-900 tabular-nums">{item.quantity}</span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            title="Generate QR code"
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setQrSku(item.variant?.sku ?? null); }}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setQrSku(item.variant?.sku ?? null); } }}
                            className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-blue-600 cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          </span>
                          <svg className="h-5 w-5 text-gray-300 transition-colors group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {["Product", "Variant", "SKU", "Warehouse", "Last Updated", "Qty", "Status", "QR"].map((h) => (
                  <th key={h} className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 ${h === "Qty" ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => {
                const st = statusOf(item.quantity);
                const { label, cls } = STATUS_LABELS[st];
                return (
                  <tr
                    key={item.id}
                    onClick={() => openLedger(item)}
                    className="cursor-pointer transition-colors hover:bg-blue-50"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.variant?.product?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {colourDot(item.variant?.color ?? "")}
                        <span className="text-sm text-gray-700">{item.variant?.color ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-500">{item.variant?.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.warehouse?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{item.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        role="button"
                        tabIndex={0}
                        title="Generate QR"
                        onClick={(e) => { e.stopPropagation(); setQrSku(item.variant?.sku ?? null); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setQrSku(item.variant?.sku ?? null); } }}
                        className="inline-block cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && total > limit && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="text-sm font-medium text-gray-700">
            Page {page} of {Math.ceil(total / limit) || 1}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(Math.ceil(total / limit), p + 1))}
            disabled={page >= Math.ceil(total / limit)}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}

      {/* QR Modal */}
      {qrSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setQrSku(null)}>
          <div className="space-y-4 rounded-2xl bg-white p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800">QR Code</h3>
            <p className="text-sm text-gray-500">Print and stick this on the product</p>
            <div id="inv-qr-print-area">
              <QRCodeSVG value={qrSku} size={200} />
            </div>
            <p className="rounded bg-gray-100 px-3 py-1.5 font-mono text-sm text-gray-600">{qrSku}</p>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={() => printQr(qrSku)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                🖨️ Print
              </button>
              <button type="button" onClick={() => setQrSku(null)} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-100 bg-gray-50 p-6">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  {colourDot(selectedItem.variant?.color ?? "")}
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedItem.variant?.product?.name ?? "Product"} — {selectedItem.variant?.color ?? "—"}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">{selectedItem.variant?.sku}</span>
                  {selectedItem.supplier && <span>· {selectedItem.supplier.name}</span>}
                  <span>·</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_LABELS[statusOf(selectedItem.quantity)].cls}`}>
                    {selectedItem.quantity} units · {STATUS_LABELS[statusOf(selectedItem.quantity)].label}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedItem(null)} className="ml-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {ledgerLoading ? (
                <div className="py-16 text-center text-sm text-gray-400">Fetching history…</div>
              ) : ledgerWithBalance.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400">No stock movements recorded yet.</div>
              ) : (
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Date & Time", "Action", "Reference", "Change", "Balance"].map((h) => (
                        <th key={h} className={`pb-3 text-xs font-medium uppercase tracking-wide text-gray-500 ${["Change", "Balance"].includes(h) ? "text-right" : "text-left"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ledgerWithBalance.map((entry) => (
                      <tr key={entry.id} className="transition-colors hover:bg-gray-50">
                        <td className="py-3 pr-4 text-sm text-gray-600">{new Date(entry.createdAt).toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${entry.action === "IN" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                            {entry.action}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500">
                          <span className="capitalize">{entry.referenceType.toLowerCase()}</span>
                          <span className="ml-1 font-mono text-[10px] text-gray-400">{entry.referenceId.slice(0, 8)}</span>
                        </td>
                        <td className={`py-3 pr-4 text-right text-sm font-bold ${entry.action === "IN" ? "text-emerald-600" : "text-orange-600"}`}>
                          {entry.action === "IN" ? "+" : "−"}{entry.quantity}
                        </td>
                        <td className="py-3 text-right text-sm font-semibold text-gray-700">{entry.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex justify-end border-t border-gray-100 bg-gray-50 p-5">
              <button type="button" onClick={() => setSelectedItem(null)} className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
