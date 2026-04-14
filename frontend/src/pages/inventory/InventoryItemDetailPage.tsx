import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import type { InventoryItem, LedgerEntry } from "../../types";
import { FEATURE_FLAGS } from "../../featureFlags";

function normalizeLedgerEntry(e: any): LedgerEntry {
  return {
    id: e.id,
    action: (e.action === "OUT" ? "OUT" : "IN") as "IN" | "OUT",
    quantity: Number(e.quantity ?? 0),
    referenceType: e.reference_type ?? e.referenceType ?? "",
    referenceId: e.reference_id ?? e.referenceId ?? "",
    createdAt: e.created_at ?? e.createdAt ?? "",
  };
}

export function InventoryItemDetailPage() {
  const { variantId } = useParams<{ variantId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    if (!variantId) return;
    setLoading(true);
    api
      .get(`/inventory/${variantId}`)
      .then((res) => setItem(res.data))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [variantId]);

  const loadLedger = () => {
    if (!variantId) return;
    setLedgerLoading(true);
    api
      .get(`/inventory/${variantId}/ledger`)
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : [];
        setLedger(raw.map(normalizeLedgerEntry));
      })
      .catch(console.error)
      .finally(() => setLedgerLoading(false));
  };

  const normalizedItem: InventoryItem | null = useMemo(() => {
    if (!item) return null;
    return {
      id: item.id,
      variantId: item.variant_id ?? item.variantId ?? item.variant?.id,
      quantity: Number(item.quantity ?? item.total_quantity ?? 0),
      updatedAt: item.updated_at ?? item.updatedAt ?? item.created_at ?? new Date().toISOString(),
      variant: {
        id: item.variant?.id ?? item.variant_id,
        sku: item.variant?.sku ?? "",
        color: item.variant?.color ?? "",
        size: item.variant?.size ?? null,
        product: {
          id: item.variant?.product?.id ?? item.variant?.product_id ?? "",
          name: item.variant?.product?.name ?? "",
          sku: item.variant?.product?.sku ?? undefined,
        },
      },
      warehouse: item.warehouse
        ? { id: item.warehouse.id, name: item.warehouse.name, code: item.warehouse.code ?? null }
        : null,
      supplier: item.supplier ?? null,
      lastPurchase: item.lastPurchase ?? null,
      lastSale: item.lastSale ?? null,
    };
  }, [item]);

  if (!variantId) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-600">Missing item id.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/inventory/items")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Items
          </button>
          <h2 className="mt-2 text-lg font-bold text-gray-900">
            {loading ? "Loading…" : normalizedItem?.variant.product.name || "Item"}
          </h2>
          {normalizedItem && (
            <p className="mt-1 text-sm text-gray-500">
              <span className="font-mono">{normalizedItem.variant.sku}</span>
              {normalizedItem.variant.product.sku ? (
                <>
                  {" "}
                  · Product Code <span className="font-mono">{normalizedItem.variant.product.sku}</span>
                </>
              ) : null}
            </p>
          )}
        </div>

        {normalizedItem && (
          <div className="flex flex-wrap items-center gap-2">
            {FEATURE_FLAGS.printInvoice && normalizedItem.lastPurchase?.id && (
              <Link
                to={`/inventory/print-invoice?id=${normalizedItem.lastPurchase.id}`}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Edit & Print GRN
              </Link>
            )}
            {normalizedItem.lastSale?.id && (
              <Link
                to={`/inventory/print-delivery-note?id=${normalizedItem.lastSale.id}`}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Edit & Print GDN
              </Link>
            )}
            <button
              type="button"
              onClick={loadLedger}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Ledger
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-white p-6 text-sm text-gray-500">Loading item…</div>
      ) : !normalizedItem ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">Item not found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <div className="text-sm font-semibold text-gray-900">Item details</div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs font-medium text-gray-500">Variant</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {normalizedItem.variant.color}
                    {normalizedItem.variant.size ? ` / ${normalizedItem.variant.size}` : ""}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs font-medium text-gray-500">On hand</div>
                  <div className="mt-1 text-sm font-bold text-gray-900">{normalizedItem.quantity}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs font-medium text-gray-500">Warehouse</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {normalizedItem.warehouse?.name ?? "—"}
                    {normalizedItem.warehouse?.code ? ` (${normalizedItem.warehouse.code})` : ""}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs font-medium text-gray-500">Last updated</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {normalizedItem.updatedAt ? new Date(normalizedItem.updatedAt).toLocaleString() : "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <div className="text-sm font-semibold text-gray-900">Supplier details</div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs font-medium text-gray-500">Supplier</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {normalizedItem.supplier?.name ?? "—"}
                    {normalizedItem.supplier?.code ? ` (${normalizedItem.supplier.code})` : ""}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-xs font-medium text-gray-500">GSM</div>
                  <div className="mt-1 text-sm text-gray-900">{normalizedItem.supplier?.phone ?? "—"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <div className="text-sm font-semibold text-gray-900">Last documents</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-600">GRN</span>
                  {normalizedItem.lastPurchase ? (
                    <Link
                      to={`/inventory/receipt-notes/${normalizedItem.lastPurchase.id}`}
                      className="font-mono text-blue-600 hover:underline"
                    >
                      {normalizedItem.lastPurchase.invoice_number}
                    </Link>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-600">GDN</span>
                  {normalizedItem.lastSale ? (
                    <span className="font-mono text-gray-800">{normalizedItem.lastSale.invoice_number}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </div>
            </div>

            {(ledgerLoading || ledger.length > 0) && (
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">Ledger</div>
                  <button
                    type="button"
                    onClick={() => setLedger([])}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Hide
                  </button>
                </div>
                <div className="mt-3">
                  {ledgerLoading ? (
                    <div className="text-sm text-gray-500">Loading ledger…</div>
                  ) : ledger.length === 0 ? (
                    <div className="text-sm text-gray-500">No ledger entries.</div>
                  ) : (
                    <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 overflow-hidden">
                      {ledger.slice(0, 12).map((e) => (
                        <div key={e.id} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-gray-700">
                              {e.action} · {e.quantity}
                            </div>
                            <div className="text-[11px] text-gray-500 truncate">
                              {e.referenceType} · {new Date(e.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-[11px] font-mono text-gray-400 shrink-0">{e.referenceId}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

