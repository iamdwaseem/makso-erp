import { useEffect, useMemo, useRef, useState } from "react";
import Barcode from "react-barcode";
import api from "../api";
import type { InventoryItem, DashboardStats, LedgerEntry } from "../types";
import { useApi } from "../hooks/useApi";
import { useWarehouseStore } from "../store/warehouseStore";
import { useNavigate } from "react-router-dom";

type StatusFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";
type ViewMode = "grid" | "table";

function statusOf(qty: number) {
  if (qty === 0) return "out_of_stock";
  if (qty < 10) return "low_stock";
  return "in_stock";
}

const STATUS_LABELS = {
  in_stock: { label: "In Stock", cls: "bg-emerald-100 text-emerald-700" },
  low_stock: { label: "Low Stock", cls: "bg-amber-100 text-amber-700" },
  out_of_stock: { label: "Out of Stock", cls: "bg-red-100 text-red-700" },
};

// Pastel colour chip for variant colours
const COLOR_DOTS: Record<string, string> = {
  black: "bg-gray-800", white: "bg-gray-100 border border-gray-300",
  red: "bg-red-500", blue: "bg-blue-500", green: "bg-green-500",
  grey: "bg-gray-400", gray: "bg-gray-400", silver: "bg-slate-300 border border-slate-400",
  "midnight black": "bg-gray-900", "space grey": "bg-slate-400",
  "matte black": "bg-gray-900", "ivory white": "bg-amber-50 border border-amber-200",
  "midnight blue": "bg-indigo-700",
};
function colourDot(colour: string) {
  const key = colour.toLowerCase();
  const cls = COLOR_DOTS[key] ?? "bg-violet-400";
  return <span className={`inline-block w-3 h-3 rounded-full shrink-0 ${cls}`} />;
}

export function Inventory() {
  const navigate = useNavigate();
  const currentWarehouseId = useWarehouseStore(state => state.currentWarehouseId);

  const [page, setPage] = useState(1);
  const limit = 50;

  // Filters
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<ViewMode>("grid");

  // Barcode modal
  const [barcodeSku, setBarcodeSku] = useState<string | null>(null);
  // Direct print from list (hidden barcode render)
  const [printSku, setPrintSku] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const printBarcode = (sku: string) => {
    const el = document.getElementById("inv-barcode-print-area");
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Barcode - ${sku}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:monospace;}p{font-size:18px;margin-top:12px;}</style></head>
      <body>${el.innerHTML}<p>${sku}</p><script>window.print();window.close();</script></body></html>`);
  };

  // Print barcode directly from list (no modal)
  const printBarcodeFromList = (sku: string) => {
    setPrintSku(sku);
  };
  useEffect(() => {
    if (!printSku) return;
    const t = setTimeout(() => {
      const el = printRef.current;
      if (el) {
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(`<html><head><title>Barcode - ${printSku}</title>
            <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:monospace;}p{font-size:18px;margin-top:12px;}</style></head>
            <body>${el.innerHTML}<p>${printSku}</p><script>window.print();window.close();</script></body></html>`);
        }
      }
      setPrintSku(null);
    }, 100);
    return () => clearTimeout(t);
  }, [printSku]);

  // Ledger modal (restored)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, productFilter, statusFilter, currentWarehouseId]);

  const { data: statsRaw } = useApi<DashboardStats>("/dashboard/stats", {
    dependencies: [currentWarehouseId]
  });
  const stats = statsRaw?.counts;

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: itemsData, meta: itemsMeta, loading } = useApi<InventoryItem[]>("/inventory", { 
    params: { page, limit, search: debouncedSearch, productId: productFilter !== "all" ? productFilter : undefined, status: statusFilter !== "all" ? statusFilter : undefined },
    dependencies: [page, debouncedSearch, productFilter, statusFilter, currentWarehouseId]
  });

  const items = itemsData || [];
  const total = itemsMeta?.total || 0;

  // ── Unique filter options ─────────────────────────────────────────────────
  const productOptions = useMemo(() => {
    const seen = new Map<string, string>();
    items.forEach(i => {
      const id = i.variant?.product?.id ?? (i as any).variant?.product_id;
      const name = i.variant?.product?.name ?? "Product";
      if (id) seen.set(id, name);
    });
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const supplierOptions = useMemo(() => {
    const labels = [
      ...new Set(
        items
          .map((i) => {
            const s = i.supplier;
            if (!s?.name) return null;
            return s.code ? `${s.name} (${s.code})` : s.name;
          })
          .filter(Boolean) as string[]
      ),
    ].sort();
    return labels;
  }, [items]);

  const anyFilterActive = search || productFilter !== "all" || supplierFilter !== "all" || statusFilter !== "all";

  const resetFilters = () => {
    setSearch(""); setProductFilter("all"); setSupplierFilter("all"); setStatusFilter("all");
  };

  // ── Filtered flat list ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(item => {
      if (q && !(
        item.variant.product.name.toLowerCase().includes(q) ||
        item.variant.color.toLowerCase().includes(q) ||
        item.variant.sku.toLowerCase().includes(q) ||
        (item.supplier?.name ?? "").toLowerCase().includes(q)
      )) return false;
      if (productFilter !== "all" && item.variant.product.id !== productFilter) return false;
      if (supplierFilter !== "all") {
        const s = item.supplier;
        const label = s?.name ? (s.code ? `${s.name} (${s.code})` : s.name) : "";
        if (label !== supplierFilter) return false;
      }
      if (statusFilter !== "all" && statusOf(item.quantity) !== statusFilter) return false;
      return true;
    });
  }, [items, search, productFilter, supplierFilter, statusFilter]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const lowCountPage = filtered.filter(i => statusOf(i.quantity) === "low_stock").length;
  const outCountPage = filtered.filter(i => statusOf(i.quantity) === "out_of_stock").length;

  // ── Grid: group filtered items by product ─────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, { productName: string; items: InventoryItem[] }>();
    filtered.forEach(item => {
      const pid = item.variant.product.id;
      if (!map.has(pid)) map.set(pid, { productName: item.variant.product.name, items: [] });
      map.get(pid)!.items.push(item);
    });
    return Array.from(map.values()).sort((a, b) => a.productName.localeCompare(b.productName));
  }, [filtered]);

  const normalizeLedgerEntry = (e: any): LedgerEntry => ({
    id: e.id,
    action: (e.action === "OUT" ? "OUT" : "IN") as "IN" | "OUT",
    quantity: Number(e.quantity ?? 0),
    referenceType: e.reference_type ?? e.referenceType ?? "",
    referenceId: e.reference_id ?? e.referenceId ?? "",
    createdAt: e.created_at ?? e.createdAt ?? "",
  });

  const openLedger = (item: InventoryItem) => {
    setSelectedItem(item);
    setLedgerLoading(true);
    setLedger([]);
    api
      .get(`/inventory/${item.variantId ?? item.variant?.id}/ledger`)
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : [];
        setLedger(raw.map(normalizeLedgerEntry));
      })
      .catch(console.error)
      .finally(() => setLedgerLoading(false));
  };

  const ledgerWithBalance = useMemo(() => {
    const asc = [...ledger].reverse();
    let bal = 0;
    const withBal = asc.map((e) => {
      bal = e.action === "IN" ? bal + e.quantity : bal - e.quantity;
      return { ...e, balance: bal };
    });
    return withBal.reverse();
  }, [ledger]);

  const openItem = (item: InventoryItem) => {
    const vid = item.variantId ?? item.variant?.id;
    if (!vid) return;
    navigate(`/inventory/items/${vid}`);
  };

  return (
    <div className="space-y-5">

      {/* Hidden barcode for direct print from list */}
      <div
        ref={printRef}
        aria-hidden
        className="absolute left-[-9999px] top-0 overflow-hidden"
      >
        {printSku && (
          <div className="flex justify-center">
            <Barcode value={printSku} format="CODE128" displayValue={true} width={2} height={48} />
          </div>
        )}
      </div>

      {/* ── Barcode Modal ───────────────────────────────────────────────── */}
      {barcodeSku && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setBarcodeSku(null)}>
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800">Barcode</h3>
            <p className="text-sm text-gray-500">Print and stick this on the product</p>
            <div id="inv-barcode-print-area" className="flex justify-center">
              <Barcode value={barcodeSku} format="CODE128" displayValue={true} width={2} height={48} />
            </div>
            <p className="font-mono text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded">{barcodeSku}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => printBarcode(barcodeSku)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">🖨️ Print</button>
              <button onClick={() => setBarcodeSku(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary chips ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Units", value: stats?.totalUnits || 0, icon: "📦", cls: "text-emerald-700 bg-emerald-50 border-emerald-100" },
          { label: "Matches Found", value: total, icon: "🏷️", cls: "text-purple-700 bg-purple-50 border-purple-100" },
          { label: "Low Stock (Page)", value: lowCountPage, icon: "⚠️", cls: "text-amber-700 bg-amber-50 border-amber-100" },
          { label: "Out of Stock (Page)", value: outCountPage, icon: "🚫", cls: "text-red-700 bg-red-50 border-red-100" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 flex items-center gap-3 ${s.cls}`}>
            <span className="text-xl">{s.icon}</span>
            <div>
              <div className="text-2xl font-bold leading-none">{s.value}</div>
              <div className="text-xs font-medium mt-0.5 opacity-75">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search product, colour, SKU…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Product filter */}
          <select value={productFilter} onChange={e => setProductFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700">
            <option value="all">All Products</option>
            {productOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>

          {/* Supplier filter */}
          <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700">
            <option value="all">All Suppliers</option>
            {supplierOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Status filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700">
            <option value="all">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {/* Reset */}
          {anyFilterActive && (
            <button onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-lg px-3 py-2 transition-colors">
              Reset
            </button>
          )}

          {/* View toggle — pushed right */}
          <div className="ml-auto flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setView("grid")}
              title="Grid view"
              className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button onClick={() => setView("table")}
              title="Table view"
              className={`p-1.5 rounded-md transition-colors ${view === "table" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-gray-400 text-sm">Loading inventory…</div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center text-gray-400 text-sm">
          No items match the current filters.{" "}
          {anyFilterActive && <button onClick={resetFilters} className="text-blue-500 hover:underline">Clear filters</button>}
        </div>
      ) : view === "grid" ? (

        /* ── GRID VIEW ─────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {grouped.map(group => {
            const hasAlert = group.items.some(i => statusOf(i.quantity) !== "in_stock");
            const totalGroupUnits = group.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <div key={group.productName}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${hasAlert ? "border-amber-200" : "border-gray-100"}`}>
                {/* Card header */}
                <div className={`px-5 py-4 border-b flex items-center justify-between ${hasAlert ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"}`}>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{group.productName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {group.items.length} variant{group.items.length !== 1 ? "s" : ""} · {totalGroupUnits} units
                    </p>
                  </div>
                  {hasAlert && <span className="text-amber-500 text-lg">⚠️</span>}
                </div>

                {/* Variant rows */}
                <div className="divide-y divide-gray-50">
                  {group.items.map(item => {
                    const st = statusOf(item.quantity);
                    const { label, cls } = STATUS_LABELS[st];
                    return (
                      <button
                        key={item.id}
                        onClick={() => openLedger(item)}
                        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left group"
                      >
                        {colourDot(item.variant.color)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{item.variant.color}</span>
                            <span className="text-xs text-gray-400 font-mono">{item.variant.sku}</span>
                          </div>
                          {item.supplier && (
                            <p className="text-xs text-gray-400 truncate">
                              {item.supplier.name}
                              {item.supplier.code ? ` (${item.supplier.code})` : ""}
                              {item.supplier.phone ? ` · ${item.supplier.phone}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-gray-900">{item.quantity}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openItem(item);
                            }}
                            title="Details"
                            className="p-1.5 rounded-lg text-gray-300 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                            </svg>
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); printBarcodeFromList(item.variant.sku); }}
                            title="Print Barcode"
                            className="p-1.5 rounded-lg text-gray-300 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setBarcodeSku(item.variant.sku); }}
                            title="View Barcode"
                            className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          </button>
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* ── TABLE VIEW ────────────────────────────────────────────────────── */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Product", "Variant", "SKU", "Supplier", "Last Updated", "Qty", "Status", "Barcode / Print"].map(h => (
                  <th key={h} className={`py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide ${h === "Qty" ? "text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => {
                const st = statusOf(item.quantity);
                const { label, cls } = STATUS_LABELS[st];
                return (
                  <tr key={item.id} onClick={() => openLedger(item)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors group">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.variant.product.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {colourDot(item.variant.color)}
                        <span className="text-sm text-gray-700">{item.variant.color}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 font-mono">{item.variant.sku}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {item.supplier
                        ? `${item.supplier.name}${item.supplier.code ? ` (${item.supplier.code})` : ""}${item.supplier.phone ? ` · ${item.supplier.phone}` : ""}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-right text-gray-900">{item.quantity}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openItem(item);
                          }}
                          title="Details"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                          </svg>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); printBarcodeFromList(item.variant.sku); }}
                          title="Print Barcode"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setBarcodeSku(item.variant.sku); }}
                          title="View Barcode"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Ledger modal (restored) ───────────────────────────────────────── */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {colourDot(selectedItem.variant.color)}
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedItem.variant.product.name} — {selectedItem.variant.color}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{selectedItem.variant.sku}</span>
                  {selectedItem.supplier && <span>· {selectedItem.supplier.name}</span>}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_LABELS[statusOf(selectedItem.quantity)].cls}`}>
                    {selectedItem.quantity} units · {STATUS_LABELS[statusOf(selectedItem.quantity)].label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors ml-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {ledgerLoading ? (
                <div className="py-16 text-center text-gray-400 text-sm">Fetching history…</div>
              ) : ledgerWithBalance.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">No stock movements recorded yet.</div>
              ) : (
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Date & Time", "Action", "Reference", "Change", "Balance"].map((h) => (
                        <th
                          key={h}
                          className={`pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide ${
                            ["Change", "Balance"].includes(h) ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ledgerWithBalance.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-sm text-gray-600 pr-4">{new Date(entry.createdAt).toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                              entry.action === "IN" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500">
                          <span className="capitalize">{entry.referenceType.toLowerCase()}</span>
                          <span className="ml-1 text-[10px] font-mono text-gray-400">{entry.referenceId.slice(0, 8)}</span>
                        </td>
                        <td
                          className={`py-3 pr-4 text-sm font-bold text-right ${
                            entry.action === "IN" ? "text-emerald-600" : "text-orange-600"
                          }`}
                        >
                          {entry.action === "IN" ? "+" : "−"}
                          {entry.quantity}
                        </td>
                        <td className="py-3 text-sm font-semibold text-right text-gray-700">{entry.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              {/* <button
                onClick={() => openItem(selectedItem)}
                className="px-5 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
              >
                Details
              </button> */}
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pagination Controls ────────────────────────────────────────────── */}
      {!loading && total > limit && (
        <div className="flex items-center justify-between border-t border-gray-100 mt-6 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ← Previous
          </button>
          <span className="text-sm font-medium text-gray-700">
            Page {page} of {Math.ceil(total / limit) || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
            disabled={page >= Math.ceil(total / limit)}
            className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
