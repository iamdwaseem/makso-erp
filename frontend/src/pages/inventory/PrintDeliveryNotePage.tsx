import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api";
import { PrintDeliveryNoteView, type DeliveryNoteDetailView } from "../../components/inventory/PrintDeliveryNoteView";

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

function buildFromSale(s: any): DeliveryNoteDetailView {
  const customer = s.customer as { name?: string; address?: string; phone?: string | null } | undefined;
  const warehouse = s.warehouse as { name?: string; location?: string | null; phone?: string | null } | undefined;
  const items = (s.items ?? []).map((it: any, idx: number) => {
    const variant = it.variant;
    const product = variant?.product;
    const qty = Number(it.quantity ?? 0);
    return {
      slNo: idx + 1,
      item: product?.name ?? variant?.sku ?? "—",
      quantity: qty,
      unit: "Pcs",
      rate: 0,
    };
  });

  const deliveryNo = s.invoice_number ?? s.id?.slice(0, 8) ?? "—";
  const deliveryDate = (s.sale_date ?? s.created_at ?? s.createdAt)
    ? new Date(s.sale_date ?? s.created_at ?? s.createdAt).toLocaleString()
    : "—";

  return {
    deliveryNo,
    deliveryDate,
    customer: customer?.name ?? "—",
    customerAddress: customer?.address ?? undefined,
    customerPhone: customer?.phone ?? undefined,
    warehouseName: warehouse?.name ?? undefined,
    warehouseAddress: warehouse?.location ?? undefined,
    warehousePhone: warehouse?.phone ?? undefined,
    items,
  };
}

export function PrintDeliveryNotePage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<DeliveryNoteDetailView | null>(null);

  const normalized = useMemo(() => query.trim(), [query]);

  const load = useCallback(async () => {
    if (!normalized) return;
    setLoading(true);
    setError(null);
    setNote(null);
    try {
      if (isUuid(normalized)) {
        const res = await api.get(`/sales/${encodeURIComponent(normalized)}`, { params: { includeDeleted: true } });
        setNote(buildFromSale(res.data));
        return;
      }

      // Resolve by delivery no (invoice_number) via sales list search
      const listRes = await api.get("/sales", { params: { search: normalized, limit: 20, page: 1, includeDeleted: true } });
      const rows = (listRes.data?.data ?? listRes.data ?? []) as any[];
      const best =
        rows.find((r) => String(r.invoice_number ?? "").trim().toUpperCase() === normalized.toUpperCase()) ??
        rows[0];
      const id = best?.id as string | undefined;
      if (!id) throw new Error("No matching delivery note found");
      const res = await api.get(`/sales/${encodeURIComponent(id)}`, { params: { includeDeleted: true } });
      setNote(buildFromSale(res.data));
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to load delivery note");
    } finally {
      setLoading(false);
    }
  }, [normalized]);

  useEffect(() => {
    const idFromLink = String(searchParams.get("id") ?? "").trim();
    if (!idFromLink) return;
    setQuery(idFromLink);
  }, [searchParams]);

  useEffect(() => {
    const idFromLink = String(searchParams.get("id") ?? "").trim();
    if (!idFromLink) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="p-6">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/inventory/stock-exit"
            className="rounded border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Print Delivery Note</h1>
        </div>
      </div>

      <div className="no-print mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Sale ID or Delivery No</label>
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste sale id (uuid) or delivery no (invoice number)"
            className="min-w-[260px] flex-1 rounded border border-gray-300 px-3 py-2 text-sm font-mono"
          />
          <button
            type="button"
            onClick={load}
            disabled={!normalized || loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load"}
          </button>
        </div>
        {error && <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
        <p className="mt-2 text-xs text-gray-500">
          Tip: after completing a sale (GDN), use the Print button to open this pre-filled.
        </p>
      </div>

      {note ? (
        <PrintDeliveryNoteView initial={note} />
      ) : (
        <div className="rounded border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          Load a delivery note to preview, edit, and print.
        </div>
      )}
    </div>
  );
}

