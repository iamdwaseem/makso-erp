"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ItemTransactionsReportPage() {
  const [rows, setRows] = useState<{ date: string; type: string; referenceId: string; warehouse: string; product: string; variant: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getInventoryMovementHistory({ limit: 200 });
      const list = Array.isArray(data) ? data : [];
      setRows(list.map((r: any) => ({
        date: r.createdAt ? new Date(r.createdAt).toLocaleString() : "—",
        type: r.type ?? "—",
        referenceId: r.referenceId ?? r.reference_id ?? "—",
        warehouse: r.warehouse ?? "—",
        product: r.product ?? "—",
        variant: r.variant ?? "—",
        quantity: Number(r.quantity ?? 0),
      })));
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
        <h1 className="text-xl font-bold text-gray-900">ITEM TRANSACTIONS</h1>
        <button type="button" onClick={load} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">Refresh</button>
        <button type="button" className="rounded border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm">Export</button>
      </div>
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reference Id</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Variant</th>
                <th className="px-4 py-3 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No transactions.</td></tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3">{row.type}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.referenceId}</td>
                    <td className="px-4 py-3">{row.warehouse}</td>
                    <td className="px-4 py-3">{row.product}</td>
                    <td className="px-4 py-3">{row.variant}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.quantity}</td>
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
