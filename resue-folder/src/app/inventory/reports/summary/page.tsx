"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function InventorySummaryReportPage() {
  const [rows, setRows] = useState<{ product: string; variant: string; warehouse: string; quantity: number; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStockReport();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">INVENTORY SUMMARY</h1>
        <button type="button" onClick={load} className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white">Refresh</button>
        <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-1.5 text-sm">Export</button>
      </div>
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}
      {loading ? (
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
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No data.</td></tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-4 py-3">{row.product}</td>
                    <td className="px-4 py-3">{row.variant}</td>
                    <td className="px-4 py-3">{row.warehouse}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
