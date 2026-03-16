import { useCallback, useEffect, useState } from "react";
import api from "../../../api";
import { useWarehouseStore } from "../../../store/warehouseStore";

type Row = { product: string; variant: string; warehouse: string; quantity: number; value: number };

export function StockReportPage() {
  const { warehouses, currentWarehouseId, setWarehouses } = useWarehouseStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState(currentWarehouseId === "all" ? "" : currentWarehouseId);

  useEffect(() => {
    if (warehouses.length > 0) return;
    api.get("/warehouses").then((r) => {
      const data = r.data?.data ?? r.data ?? [];
      setWarehouses(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, [warehouses.length, setWarehouses]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: "500" };
      if (warehouseId) params.warehouseId = warehouseId;
      const res = await api.get("/inventory", { params });
      const data = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(data) ? data : [];
      setRows(
        list.map((i: any) => ({
          product: i.variant?.product?.name ?? "—",
          variant: i.variant?.color ?? i.variant?.sku ?? "—",
          warehouse: i.warehouse?.name ?? "—",
          quantity: i.quantity ?? i.total_quantity ?? 0,
          value: 0,
        }))
      );
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

  useEffect(() => {
    if (currentWarehouseId && currentWarehouseId !== "all") setWarehouseId(currentWarehouseId);
  }, [currentWarehouseId]);

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">STOCK REPORT</h1>
        <select
          className="rounded border border-gray-200 px-3 py-1.5 text-sm"
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
        >
          <option value="">All warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setWarehouseId("")} className="rounded bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200">
          Reset
        </button>
      </div>
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
                <th className="px-4 py-3">Variant</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No stock data.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.product}</td>
                    <td className="px-4 py-3 text-gray-800">{row.variant}</td>
                    <td className="px-4 py-3 text-gray-800">{row.warehouse}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
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
