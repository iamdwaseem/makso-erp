import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { InventoryTransferForm, type TransferCreatePayload } from "../../components/inventory/InventoryTransferForm";

type TransferRow = {
  id: string;
  createdAt: string;
  status: string;
  sourceWarehouse: string;
  targetWarehouse: string;
  totalQty: number;
};

function toCreateBody(payload: TransferCreatePayload) {
  return {
    source_warehouse_id: payload.sourceWarehouseId,
    target_warehouse_id: payload.targetWarehouseId,
    items: payload.items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
  };
}

/** POST /inventory/transfers returns the transfer object at the root of the JSON body (camelCase). */
function transferIdFromCreateResponse(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const o = data as Record<string, unknown>;
  if (typeof o.id === "string") return o.id;
  const inner = o.data;
  if (inner && typeof inner === "object" && typeof (inner as Record<string, unknown>).id === "string") {
    return (inner as Record<string, unknown>).id as string;
  }
  return undefined;
}

export function InventoryTransfersPage() {
  const [rows, setRows] = useState<TransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listBusy, setListBusy] = useState(false);

  const load = () => {
    setListBusy(true);
    setError(null);
    api
      .get("/inventory/transfers", { params: { limit: 50 } })
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        const list = Array.isArray(data) ? data : [];
        const mapped: TransferRow[] = list.map((t: Record<string, unknown>) => {
          const items = (t.items as { quantity?: number }[] | undefined) ?? [];
          const totalQty = items.reduce((s, i) => s + Number(i.quantity ?? 0), 0);
          const sw = t.sourceWarehouse as { name?: string } | undefined;
          const tw = t.targetWarehouse as { name?: string } | undefined;
          return {
            id: t.id as string,
            createdAt: (t.createdAt ?? t.created_at) as string,
            status: (t.status as string) ?? "DRAFT",
            sourceWarehouse: sw?.name ?? "—",
            targetWarehouse: tw?.name ?? "—",
            totalQty,
          };
        });
        setRows(mapped);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load transfers");
        setRows([]);
      })
      .finally(() => {
        setLoading(false);
        setListBusy(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaveDraft = async (payload: TransferCreatePayload) => {
    await api.post("/inventory/transfers", toCreateBody(payload));
    load();
  };

  const handleComplete = async (payload: TransferCreatePayload) => {
    const createRes = await api.post("/inventory/transfers", toCreateBody(payload));
    const tid = transferIdFromCreateResponse(createRes.data);
    if (!tid) throw new Error("No transfer id returned");
    await api.post(`/inventory/transfers/${tid}/submit`, {});
    load();
  };

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">Inventory transfer</h1>
      <p className="mb-6 text-sm text-gray-500">
        Move stock between warehouses. Save a draft to finish later, or complete to move stock immediately.
      </p>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
      )}

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">New transfer</h2>
        <InventoryTransferForm
          showDraftButton
          showCompleteButton
          onSaveDraft={handleSaveDraft}
          onComplete={handleComplete}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Recent transfers</h2>
          {listBusy && <span className="text-xs text-gray-400">Updating…</span>}
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">No transfers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3 text-right">Total qty</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/inventory/transfers/${row.id}`}
                        className="font-mono text-xs text-blue-600 hover:underline"
                      >
                        {row.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">{row.sourceWarehouse}</td>
                    <td className="px-4 py-3">{row.targetWarehouse}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.totalQty.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          row.status === "SUBMITTED"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
