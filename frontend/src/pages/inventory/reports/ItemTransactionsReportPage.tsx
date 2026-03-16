import { useCallback, useEffect, useState } from "react";
import api from "../../../api";
import { useWarehouseStore } from "../../../store/warehouseStore";

type Entry = { id: string; type: string; date: string; refId?: string; product?: string; variant?: string; change: number };

export function ItemTransactionsReportPage() {
  const { currentWarehouseId } = useWarehouseStore();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const warehouseId = currentWarehouseId && currentWarehouseId !== "all" ? currentWarehouseId : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/history", { params: { limit: 100, warehouseId: warehouseId || undefined } });
      const data = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(data) ? data : [];
      const out: Entry[] = [];
      list.forEach((h: any) => {
        const date = h.date ?? h.purchase_date ?? h.sale_date ?? h.created_at ?? "";
        const type = h.type ?? (h.purchase_date ? "entry" : "exit");
        (h.items ?? []).forEach((item: any) => {
          out.push({
            id: `${h.id}-${item.variant_id ?? item.variantId ?? out.length}`,
            type,
            date,
            refId: h.id,
            product: item.variant?.product?.name ?? item.product?.name,
            variant: item.variant?.color ?? item.variant?.sku,
            change: type === "entry" ? (item.quantity ?? 0) : -(item.quantity ?? 0),
          });
        });
        if ((h.items ?? []).length === 0)
          out.push({
            id: h.id,
            type: type,
            date,
            refId: h.id,
            change: 0,
          });
      });
      setEntries(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold text-gray-900">ITEM TRANSACTIONS</h1>
      {error && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">{error}</div>
      )}
      {loading && entries.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Variant</th>
                <th className="px-4 py-3 text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No transactions.
                  </td>
                </tr>
              ) : (
                entries.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-600">{new Date(row.date).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${row.type === "entry" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.product ?? "—"}</td>
                    <td className="px-4 py-3">{row.variant ?? "—"}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-medium ${row.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {row.change >= 0 ? "+" : ""}{row.change}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
