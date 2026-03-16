import { useCallback, useEffect, useState } from "react";
import api from "../../../api";
import { useWarehouseStore } from "../../../store/warehouseStore";

type Row = { variantId: string; product: string; variant: string; sku: string; quantity: number; reorderLevel: number };

export function LowStockReportPage() {
  const { currentWarehouseId } = useWarehouseStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const warehouseId = currentWarehouseId && currentWarehouseId !== "all" ? currentWarehouseId : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/dashboard/stats", { params: warehouseId ? { warehouseId } : {} });
      const list = res.data?.lowStockRows ?? [];
      setRows(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold text-gray-900">LOW STOCK</h1>
      <p className="mb-4 text-sm text-gray-500">Items below reorder point. Replenish to avoid stock-outs.</p>
      {error && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">{error}</div>
      )}
      {loading && rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Variant / SKU</th>
                <th className="px-4 py-3">Reorder Point</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Difference</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No low-stock items.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.variantId} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.product}</td>
                    <td className="px-4 py-3 text-gray-800">{row.variant} / {row.sku}</td>
                    <td className="px-4 py-3">{row.reorderLevel}</td>
                    <td className="px-4 py-3">{row.quantity}</td>
                    <td className="px-4 py-3 font-medium text-orange-600">{row.reorderLevel - row.quantity}</td>
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
