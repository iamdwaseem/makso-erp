import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api";
import { InventoryTransferForm, type TransferCreatePayload } from "../../components/inventory/InventoryTransferForm";

type TransferItem = {
  id?: string;
  variantId?: string;
  variant_id?: string;
  quantity: number;
  variant?: { sku?: string; product?: { name?: string } };
};

type TransferDetail = {
  id: string;
  status: string;
  createdAt?: string;
  created_at?: string;
  sourceWarehouseId?: string;
  source_warehouse_id?: string;
  targetWarehouseId?: string;
  target_warehouse_id?: string;
  sourceWarehouse?: { id?: string; name?: string };
  source_warehouse?: { id?: string; name?: string };
  targetWarehouse?: { id?: string; name?: string };
  target_warehouse?: { id?: string; name?: string };
  items?: TransferItem[];
};

function toCreateBody(payload: TransferCreatePayload) {
  return {
    source_warehouse_id: payload.sourceWarehouseId,
    target_warehouse_id: payload.targetWarehouseId,
    items: payload.items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
  };
}

export function InventoryTransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/inventory/transfers/${id}`);
      setTransfer(res.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err.response?.data?.error || err.message || "Failed to load transfer");
      setTransfer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const sourceId =
    transfer?.sourceWarehouseId ?? transfer?.source_warehouse_id ?? transfer?.sourceWarehouse?.id ?? "";
  const targetId =
    transfer?.targetWarehouseId ?? transfer?.target_warehouse_id ?? transfer?.targetWarehouse?.id ?? "";

  const defaultRows =
    transfer?.items?.map((line) => {
      const sku = line.variant?.sku ?? "";
      const name = line.variant?.product?.name;
      return {
        variantId: String(line.variantId ?? line.variant_id ?? ""),
        sku,
        quantity: String(line.quantity ?? ""),
        resolvedLabel: name && sku ? `${name} · ${sku}` : sku || undefined,
      };
    }) ?? [];

  const handleSaveDraft = async (payload: TransferCreatePayload) => {
    if (!id) return;
    await api.patch(`/inventory/transfers/${id}`, toCreateBody(payload));
    setFormKey((k) => k + 1);
    await load();
  };

  const handleComplete = async (payload: TransferCreatePayload) => {
    if (!id) return;
    await api.patch(`/inventory/transfers/${id}`, toCreateBody(payload));
    await api.post(`/inventory/transfers/${id}/submit`, {});
    await load();
  };

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Missing transfer id.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link to="/inventory/transfers" className="text-sm text-blue-600 hover:underline">
          ← Back to transfers
        </Link>
      </div>

      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">Transfer detail</h1>
      <p className="mb-1 font-mono text-xs text-gray-500">{id}</p>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : !transfer ? null : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span
              className={`rounded px-2 py-1 text-xs font-semibold uppercase ${
                transfer.status === "SUBMITTED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"
              }`}
            >
              {transfer.status}
            </span>
            <span className="text-sm text-gray-600">
              {(transfer.createdAt || transfer.created_at) &&
                new Date((transfer.createdAt || transfer.created_at) as string).toLocaleString()}
            </span>
          </div>

          {transfer.status === "SUBMITTED" ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-xs font-medium uppercase text-gray-500">From</span>
                  <p className="font-medium text-gray-900">
                    {transfer.sourceWarehouse?.name ?? transfer.source_warehouse?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase text-gray-500">To</span>
                  <p className="font-medium text-gray-900">
                    {transfer.targetWarehouse?.name ?? transfer.target_warehouse?.name ?? "—"}
                  </p>
                </div>
              </div>
              <h2 className="mb-2 text-sm font-semibold uppercase text-gray-700">Lines</h2>
              <div className="overflow-x-auto rounded border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(transfer.items ?? []).map((line, idx) => (
                      <tr key={line.id ?? idx} className="border-b border-gray-50">
                        <td className="px-3 py-2 font-mono text-xs">{line.variant?.sku ?? "—"}</td>
                        <td className="px-3 py-2">{line.variant?.product?.name ?? "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{line.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="mb-4 text-sm text-gray-600">
                Update the draft below, then save or complete. Completing will move stock from the source warehouse
                to the destination.
              </p>
              <InventoryTransferForm
                key={formKey}
                defaultSourceId={sourceId}
                defaultTargetId={targetId}
                defaultRows={defaultRows.length ? defaultRows : undefined}
                showDraftButton
                showCompleteButton
                onSaveDraft={handleSaveDraft}
                onComplete={handleComplete}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
