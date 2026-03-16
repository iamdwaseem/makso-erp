import { useCallback, useEffect, useState } from "react";
import api from "../../../api";
import { useWarehouseStore } from "../../../store/warehouseStore";

export function InventorySummaryReportPage() {
  const { currentWarehouseId } = useWarehouseStore();
  const [stats, setStats] = useState<{ counts?: Record<string, number>; itemGroups?: { name: string; value: number }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const warehouseId = currentWarehouseId && currentWarehouseId !== "all" ? currentWarehouseId : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/dashboard/stats", { params: warehouseId ? { warehouseId } : {} });
      setStats(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  const c = stats?.counts ?? {};
  const groups = stats?.itemGroups ?? [];

  if (loading && !stats) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold text-gray-900">INVENTORY SUMMARY</h1>
      {error && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">{error}</div>
      )}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold tabular-nums text-gray-900">{(c.totalUnits ?? c.totalStock ?? 0).toLocaleString()}</div>
          <div className="mt-1 text-xs font-medium uppercase text-gray-500">Total Stock (Units)</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold tabular-nums text-gray-900">{c.totalProducts ?? "—"}</div>
          <div className="mt-1 text-xs font-medium uppercase text-gray-500">Total Products</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold tabular-nums text-gray-900">{c.totalVariants ?? "—"}</div>
          <div className="mt-1 text-xs font-medium uppercase text-gray-500">Total Variants</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold tabular-nums text-gray-900">{c.lowStockCount ?? "—"}</div>
          <div className="mt-1 text-xs font-medium uppercase text-gray-500">Low Stock Items</div>
        </div>
      </div>
      {groups.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <h2 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">By product group</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Product / Group</th>
                <th className="px-4 py-3 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{g.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{g.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
