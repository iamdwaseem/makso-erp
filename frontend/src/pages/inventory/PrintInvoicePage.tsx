import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api";
import { PrintInvoiceView, type InvoiceDetailView } from "../../components/inventory/PrintInvoiceView";

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

function buildInvoiceFromPurchase(p: any): InvoiceDetailView {
  const supplier = p.supplier as { name?: string; address?: string; phone?: string | null } | undefined;
  const warehouse = p.warehouse as { name?: string; location?: string | null; phone?: string | null } | undefined;
  const items = (p.items ?? []).map((it: any, idx: number) => {
    const variant = it.variant;
    const product = variant?.product;
    const qty = Number(it.quantity ?? 0);
    const rate = 0;
    const amount = qty * rate;
    return {
      slNo: idx + 1,
      item: product?.name ?? variant?.sku ?? "—",
      quantity: qty,
      unit: "Pcs",
      rate,
      amount,
      vatPercent: undefined,
      vatAmount: undefined,
      total: amount,
    };
  });

  const invoiceNo = p.invoice_number ?? p.id?.slice(0, 8) ?? "—";
  const invoiceDate = (p.purchase_date ?? p.created_at ?? p.createdAt)
    ? new Date(p.purchase_date ?? p.created_at ?? p.createdAt).toLocaleString()
    : "—";

  const grandTotal = 0;

  return {
    invoiceNo,
    invoiceDate,
    supplier: supplier?.name ?? "—",
    supplierAddress: supplier?.address ?? undefined,
    supplierPhone: supplier?.phone ?? undefined,
    warehouseName: warehouse?.name ?? undefined,
    warehouseAddress: warehouse?.location ?? undefined,
    warehousePhone: warehouse?.phone ?? undefined,
    items,
    grandTotal,
    subtotal: grandTotal,
    taxAmount: 0,
  };
}

export function PrintInvoicePage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceDetailView | null>(null);

  const normalizedId = useMemo(() => query.trim(), [query]);

  const load = useCallback(async () => {
    if (!normalizedId) return;
    setLoading(true);
    setError(null);
    setInvoice(null);
    try {
      if (isUuid(normalizedId)) {
        const res = await api.get(`/purchases/${encodeURIComponent(normalizedId)}`, { params: { includeDeleted: true } });
        setInvoice(buildInvoiceFromPurchase(res.data));
        return;
      }

      // Resolve "receipt no" (invoice_number) via list search.
      const listRes = await api.get("/purchases", { params: { search: normalizedId, limit: 20, page: 1, includeDeleted: true } });
      const rows = (listRes.data?.data ?? listRes.data ?? []) as any[];
      const best =
        rows.find((r) => String(r.invoice_number ?? "").trim().toUpperCase() === normalizedId.toUpperCase()) ??
        rows[0];
      const id = best?.id as string | undefined;
      if (!id) throw new Error("No matching purchase found");
      const res = await api.get(`/purchases/${encodeURIComponent(id)}`, { params: { includeDeleted: true } });
      setInvoice(buildInvoiceFromPurchase(res.data));
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [normalizedId]);

  // Auto-load when navigated from GRN list/detail with ?id=
  useEffect(() => {
    const idFromLink = String(searchParams.get("id") ?? "").trim();
    if (!idFromLink) return;
    setQuery(idFromLink);
  }, [searchParams]);

  useEffect(() => {
    const idFromLink = String(searchParams.get("id") ?? "").trim();
    if (!idFromLink) return;
    // trigger once we copied it into state
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="p-6">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/inventory/dashboard"
            className="rounded border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Print Invoice</h1>
        </div>
      </div>

      <div className="no-print mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Purchase / GRN ID or Receipt No</label>
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste GRN id (uuid) or receipt no (invoice number)"
            className="min-w-[260px] flex-1 rounded border border-gray-300 px-3 py-2 text-sm font-mono"
          />
          <button
            type="button"
            onClick={load}
            disabled={!normalizedId || loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load"}
          </button>
        </div>
        {error && <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
        <p className="mt-2 text-xs text-gray-500">
          Tip: use the Print button from Goods Receipt Notes list/detail to open this pre-filled.
        </p>
      </div>

      {invoice ? (
        <PrintInvoiceView invoice={invoice} />
      ) : (
        <div className="rounded border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          Load a purchase to preview and print.
        </div>
      )}
    </div>
  );
}

