import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useWarehouseStore } from "../../store/warehouseStore";
import { StockEntry } from "../StockEntry";
import { FEATURE_FLAGS } from "../../featureFlags";

type ImportLine = { category?: string; productName?: string; sku: string; quantity: number };

function parseCsv(csvText: string): ImportLine[] {
  const lines = csvText.trim().split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];

  const first = lines[0].split(",").map((c) => c.trim());
  const header = first.map((c) => c.toLowerCase());

  const isFullHeader =
    header[0] === "category" &&
    header[1]?.startsWith("product") &&
    header[2] === "quantity" &&
    header[3] === "sku";

  const isSimpleHeader = header[0] === "sku" && (header[1] === "quantity" || header[1] === "qty");

  const start = isFullHeader || isSimpleHeader ? 1 : 0;
  const result: ImportLine[] = [];

  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p) => p.trim());

    if (isFullHeader) {
      const category = parts[0] ?? "";
      const productName = parts[1] ?? "";
      const qty = parseInt(parts[2] ?? "0", 10);
      const sku = parts[3] ?? "";
      if (sku && !Number.isNaN(qty) && qty > 0) {
        result.push({ category, productName, sku, quantity: qty });
      }
    } else {
      const sku = parts[0] ?? "";
      const qty = parseInt(parts[1] ?? "0", 10);
      if (sku && !Number.isNaN(qty) && qty > 0) {
        result.push({ sku, quantity: qty });
      }
    }
  }
  return result;
}

type ViewMode = "list" | "form";

type ReceiptNoteRow = {
  id: string;
  receiptNo: string;
  date: string;
  onTransaction: string;
  supplierOrCustomer: string;
  amount: number;
  status: string;
};

const STATUS_OPTIONS = ["all", "DRAFT", "SUBMITTED", "CANCELLED"] as const;
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

function mapPurchaseToRow(p: any): ReceiptNoteRow {
  const items = p.items ?? [];
  const totalQty = items.reduce((s: number, i: any) => s + Number(i.quantity ?? 0), 0);
  return {
    id: p.id,
    receiptNo: p.invoice_number ?? p.id?.slice(0, 8) ?? "—",
    date: (p.purchase_date || p.created_at) ? new Date(p.purchase_date || p.created_at).toLocaleString() : "—",
    onTransaction: "GRN",
    supplierOrCustomer: p.supplier?.name ?? "—",
    amount: totalQty,
    status: p.status ?? "SUBMITTED",
  };
}

type ListMeta = { total: number; page: number; limit: number; totalPages: number };

export function GoodsReceiptNotesPage() {
  const { user } = useAuth();
  const { currentWarehouseId } = useWarehouseStore();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [notes, setNotes] = useState<ReceiptNoteRow[]>([]);
  const [listMeta, setListMeta] = useState<ListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showDeletedList, setShowDeletedList] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importLines, setImportLines] = useState<ImportLine[]>([]);
  const [importSupplierId, setImportSupplierId] = useState("");
  const [importInvoiceNumber, setImportInvoiceNumber] = useState("");
  const [suppliers, setSuppliers] = useState<{ id: string; name: string; code?: string; phone?: string | null }[]>([]);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, showDeletedList]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean> = {
        limit: PAGE_SIZE,
        page,
        ...(showDeletedList ? { deletedOnly: true } : {}),
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (!showDeletedList && statusFilter !== "all") params.status = statusFilter;

      const res = await api.get("/purchases", { params });
      const data = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(data) ? data : [];
      setNotes(list.map(mapPurchaseToRow));
      const m = res.data?.meta;
      if (m && typeof m.total === "number") {
        setListMeta({
          total: m.total,
          page: m.page ?? page,
          limit: m.limit ?? PAGE_SIZE,
          totalPages: m.totalPages ?? Math.max(1, Math.ceil(m.total / (m.limit || PAGE_SIZE))),
        });
      } else {
        setListMeta(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setNotes([]);
      setListMeta(null);
    } finally {
      setLoading(false);
    }
  }, [showDeletedList, page, debouncedSearch, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (showImportModal && suppliers.length === 0) {
      api.get("/suppliers", { params: { limit: 500 } }).then((r) => setSuppliers(r.data?.data ?? r.data ?? [])).catch(console.error);
    }
  }, [showImportModal, suppliers.length]);

  const openImportModal = () => {
    setImportLines([]);
    setImportSupplierId("");
    setImportInvoiceNumber("");
    setImportError(null);
    setShowImportModal(true);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCsv(text);
      setImportLines(parsed);
      setImportError(
        parsed.length === 0
          ? "No valid rows (expected Category,Product Name,Quantity,SKU or SKU,Quantity)"
          : null
      );
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (!currentWarehouseId || currentWarehouseId === "all") {
      setImportError("Please select a specific warehouse in the header.");
      return;
    }
    if (!importSupplierId) {
      setImportError("Please select a supplier.");
      return;
    }
    if (importLines.length === 0) {
      setImportError(
        "Upload a CSV with at least one row (Category,Product Name,Quantity,SKU)."
      );
      return;
    }
    setImportSubmitting(true);
    setImportError(null);
    try {
      await api.post("/purchases/import-from-csv", {
        supplierId: importSupplierId,
        warehouseId: currentWarehouseId,
        invoiceNumber: importInvoiceNumber || undefined,
        lines: importLines.map((l) => ({
          category: l.category,
          productName: l.productName,
          sku: l.sku,
          quantity: l.quantity,
        })),
      });
      setShowImportModal(false);
      load();
    } catch (err: any) {
      setImportError(err.response?.data?.error || err.message || "Import failed");
    } finally {
      setImportSubmitting(false);
    }
  };

  const handleRestore = async (purchaseId: string) => {
    setRestoringId(purchaseId);
    setError(null);
    try {
      await api.post(`/purchases/${purchaseId}/restore`);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err.response?.data?.error || err.message || "Restore failed");
    } finally {
      setRestoringId(null);
    }
  };

  if (viewMode === "form") {
    return (
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
          <h1 className="text-lg font-semibold uppercase">New Goods Receipt Note</h1>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className="rounded p-2 text-white/90 hover:bg-white/10"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <StockEntry />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Goods Receipt Note</h1>
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setShowDeletedList(false)}
              className={`rounded-md px-3 py-1.5 font-medium ${!showDeletedList ? "bg-slate-800 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setShowDeletedList(true)}
              className={`rounded-md px-3 py-1.5 font-medium ${showDeletedList ? "bg-amber-700 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Deleted
            </button>
          </div>
          {!showDeletedList && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>
              ))}
            </select>
          )}
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search receipt no, supplier, ID, status…"
            className="min-w-[14rem] max-w-md flex-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm placeholder:text-gray-400"
            aria-label="Search goods receipt notes"
          />
        </div>
        <div className="flex gap-2">
          {!showDeletedList && (
            <>
              <button
                type="button"
                onClick={() => setViewMode("form")}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                NEW
              </button>
              <button
                type="button"
                onClick={openImportModal}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                IMPORT
              </button>
            </>
          )}
          <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            EXPORT
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
      )}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">On Transaction</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3 text-right">Total Qty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {!loading && notes.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      No goods receipt notes match your filters. Try another search or page.
                    </td>
                  </tr>
                )}
                {notes.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{row.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-medium">{row.receiptNo}</td>
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3">{row.onTransaction}</td>
                    <td className="px-4 py-3">{row.supplierOrCustomer}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(row.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          row.status === "SUBMITTED" ? "bg-green-100 text-green-800" :
                          row.status === "DRAFT" ? "bg-gray-100 text-gray-700" :
                          row.status === "CANCELLED" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/inventory/receipt-notes/${row.id}`} className="mr-3 text-blue-600 hover:underline">
                        View
                      </Link>
                      {FEATURE_FLAGS.printInvoice && !showDeletedList && (
                        <Link
                          to={`/inventory/print-invoice?id=${encodeURIComponent(row.id)}`}
                          className="mr-3 text-blue-600 hover:underline"
                        >
                          Print
                        </Link>
                      )}
                      {showDeletedList ? (
                        (user?.role === "MANAGER" || user?.role === "ADMIN") && (
                          <button
                            type="button"
                            onClick={() => handleRestore(row.id)}
                            disabled={restoringId === row.id}
                            className="text-green-700 hover:underline disabled:opacity-50"
                          >
                            {restoringId === row.id ? "Restoring…" : "Restore"}
                          </button>
                        )
                      ) : (
                        (user?.role === "MANAGER" || user?.role === "ADMIN") && (
                          <Link to={`/inventory/receipt-notes/${row.id}?edit=1`} className="text-blue-600 hover:underline">
                            Edit
                          </Link>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {listMeta && listMeta.totalPages > 0 && (
            <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between">
              <p className="tabular-nums">
                Page {listMeta.page} of {listMeta.totalPages}
                <span className="text-gray-500"> · {listMeta.total} total</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-gray-300 bg-white px-3 py-1.5 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= listMeta.totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-gray-300 bg-white px-3 py-1.5 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl flex flex-col">
            <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Import from CSV</h2>
              <button type="button" onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportFileChange}
            />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Upload a CSV with columns{" "}
                <strong>Category</strong>, <strong>Product Name</strong>,{" "}
                <strong>Quantity</strong>, <strong>SKU</strong>. The first row
                should be the header exactly in that order.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {importLines.length > 0 ? "Replace CSV" : "Select CSV file"}
              </button>
              {importLines.length > 0 && (
                <>
                  <div className="rounded border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">
                            Category
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">
                            Product Name
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">
                            SKU
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {importLines.slice(0, 20).map((line, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-900">
                              {line.category ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-gray-900">
                              {line.productName ?? "—"}
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              {line.sku}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {line.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importLines.length > 20 && <p className="px-3 py-2 text-xs text-gray-500 bg-gray-50">… and {importLines.length - 20} more rows</p>}
                  </div>
                  <p className="text-xs text-gray-500">{importLines.length} row(s) will be imported as one Goods Receipt Note.</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                    <select
                      value={importSupplierId}
                      onChange={(e) => setImportSupplierId(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.code ? ` (${s.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice number (optional)</label>
                    <input
                      type="text"
                      value={importInvoiceNumber}
                      onChange={(e) => setImportInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-001"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  {currentWarehouseId && currentWarehouseId !== "all" && (
                    <p className="text-sm text-gray-600">Warehouse: <strong>Current selection</strong> (change in header if needed).</p>
                  )}
                </>
              )}
              {importError && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{importError}</div>}
            </div>
            <div className="border-t border-gray-200 px-4 py-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowImportModal(false)} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importSubmitting || importLines.length === 0}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {importSubmitting ? "Importing…" : "Confirm import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
