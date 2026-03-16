"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

function formatAmount(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SupplierAgingReportPage() {
  const [rows, setRows] = useState<{ supplierId: string; supplierName: string; totalAmount: number; outstanding: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSupplierAging();
      const list = Array.isArray(data) ? data : [];
      setRows(list.map((r: any) => ({
        supplierId: r.supplierId ?? r.supplier_id ?? "",
        supplierName: r.supplierName ?? r.supplier_name ?? "",
        totalAmount: Number(r.totalAmount ?? r.total_amount ?? 0),
        outstanding: Number(r.outstanding ?? 0),
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">SUPPLIER AGING REPORT</h1>
          <p className="mt-1 text-sm text-gray-500">Outstanding purchases by supplier</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white">Refresh</button>
          <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">Export</button>
        </div>
      </div>
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Supplier ID</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No outstanding supplier balances.</td></tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.supplierId + i} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{row.supplierId}</td>
                    <td className="px-4 py-3 font-medium">{row.supplierName}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatAmount(row.totalAmount)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatAmount(row.outstanding)}</td>
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
