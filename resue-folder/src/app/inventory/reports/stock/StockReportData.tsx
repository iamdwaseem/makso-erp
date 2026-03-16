"use client";

import { useEffect, useState } from "react";
import { api, type StockReportRow } from "@/lib/api";

type WarehouseOption = { id: string; name: string };

export default function StockReportData() {
  const [rows, setRows] = useState<StockReportRow[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    api.getWarehouses().then((list) => {
      if (!cancelled && Array.isArray(list)) setWarehouses(list);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getStockReport(warehouseId || undefined)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load stock report");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [warehouseId]);

  if (loading && rows.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
        Loading stock report…
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">STOCK REPORT</h1>
        <input
          type="text"
          placeholder="Item name"
          className="rounded border border-gray-200 px-3 py-1.5 text-sm"
        />
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
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          onClick={() => setWarehouseId("")}
        >
          Reset
        </button>
      </div>
      {error && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {error}
        </div>
      )}
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
                  No stock data. Ensure backend is running and inventory exists.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.product}</td>
                  <td className="px-4 py-3 text-gray-800">{row.variant}</td>
                  <td className="px-4 py-3 text-gray-800">{row.warehouse}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.quantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
