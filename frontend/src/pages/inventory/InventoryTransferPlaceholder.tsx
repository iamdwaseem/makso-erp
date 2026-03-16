import { useEffect, useState } from "react";
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

export function InventoryTransferPlaceholder() {
  const [rows, setRows] = useState<TransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .get("/transfers", { params: { limit: 50 } })
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        const list = Array.isArray(data) ? data : [];
        const mapped: TransferRow[] = list.map((t: any) => {
          const totalQty =
            (t.items ?? []).reduce((s: number, i: any) => s + Number(i.quantity ?? 0), 0) ?? 0;
          return {
            id: t.id,
            createdAt: t.created_at || t.createdAt,
            status: t.status ?? "DRAFT",
            sourceWarehouse: t.source_warehouse?.name ?? t.sourceWarehouse?.name ?? "—",
            targetWarehouse: t.target_warehouse?.name ?? t.targetWarehouse?.name ?? "—",
            totalQty,
          };
        });
        setRows(mapped);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load transfers");
        setRows([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleTransfer = async (payload: TransferCreatePayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        source_warehouse_id: payload.sourceWarehouseId,
        target_warehouse_id: payload.targetWarehouseId,
        items: payload.items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
      };
      const createRes = await api.post("/transfers", body);
      const id = createRes.data?.id ?? createRes.data?.data?.id;
      if (id) {
        await api.post(`/transfers/${id}/submit`, {});
      }
      load();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
        INVENTORY TRANSFER
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Move stock between warehouses. Select FROM and TO warehouses and the variants to transfer.
      </p>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <InventoryTransferForm onSaveAndApprove={handleTransfer} />
        {submitting && (
          <p className="mt-2 text-xs text-gray-500">Submitting transfer…</p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Recent Transfers
          </h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No transfers recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3 text-right">Total Qty</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{row.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-xs">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{row.sourceWarehouse}</td>
                    <td className="px-4 py-3">{row.targetWarehouse}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.totalQty.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          row.status === "SUBMITTED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
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

