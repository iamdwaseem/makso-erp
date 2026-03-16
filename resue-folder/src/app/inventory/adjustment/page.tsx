"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Search } from "lucide-react";

const itemRowsInitial = [{ slNo: 1, item: "", unit: "", value: "", lessQty: "Eg: 20", moreQty: "Eg: 20", serialNumbers: "" }];

export default function InventoryAdjustmentPage() {
  const [showForm, setShowForm] = useState(false);
  const [adjustments, setAdjustments] = useState<{ id: string; date: string; type: string; center: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState("17/10/2021");
  const [adjustmentType, setAdjustmentType] = useState("");
  const [center, setCenter] = useState("warehouse");
  const [notes, setNotes] = useState("");
  const [employee, setEmployee] = useState("");
  const [onAccount, setOnAccount] = useState("");
  const [itemRows, setItemRows] = useState(itemRowsInitial);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdjustments({ page: 1, limit: 100 });
      setAdjustments(
        (res.data ?? []).map((a: any) => ({
          id: a.id,
          date: a.createdAt ? new Date(a.createdAt).toLocaleString() : "—",
          type: a.reason ?? "Adjustment",
          center: (a.warehouse as any)?.name ?? "—",
          quantity: Number(a.quantity ?? 0),
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addItemRow = () => {
    setItemRows((prev) => [...prev, { slNo: prev.length + 1, item: "", unit: "", value: "", lessQty: "", moreQty: "", serialNumbers: "" }]);
  };

  return (
    <div className="p-6">
      {!showForm ? (
        <>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">INVENTORY ADJUSTMENT</h1>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(true)} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
              <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">EXPORT</button>
            </div>
          </div>
          {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}
          {loading ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div>
          ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Center</th>
                  <th className="px-4 py-3">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{row.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3">{row.type}</td>
                    <td className="px-4 py-3">{row.center}</td>
                    <td className="px-4 py-3">{row.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
            <h1 className="text-lg font-semibold uppercase">NEW INVENTORY ADJUSTMENT</h1>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Save</button>
              <button type="button" className="rounded bg-blue-700 px-3 py-1.5 text-sm text-white hover:bg-blue-800">Save And Approve</button>
              <button type="button" className="rounded border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10">Reset</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10">Cancel</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded p-2 text-white/90 hover:bg-white/10" aria-label="Close">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-600">DATE *</label>
                <div className="flex gap-1">
                  <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
                  <span className="flex items-center rounded border border-gray-200 bg-gray-50 px-2 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-600">ADJUSTMENT TYPE *</label>
                <input type="text" value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value)} placeholder="Adjustment Type" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-600">CENTER *</label>
                <input type="text" value={center} onChange={(e) => setCenter(e.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-600">NOTES</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-600">EMPLOYEE</label>
                <input type="text" value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder="Employee" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-600">ON ACCOUNT *</label>
                <div className="flex gap-1">
                  <input type="text" value={onAccount} onChange={(e) => setOnAccount(e.target.value)} placeholder="Account" className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm" />
                  <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Search className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase text-gray-700">ITEMS</h3>
              <div className="overflow-x-auto rounded border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                      <th className="px-3 py-2">Sl Num</th>
                      <th className="px-3 py-2">Item *</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2">Value</th>
                      <th className="px-3 py-2">Less Quantity</th>
                      <th className="px-3 py-2">More Quantity</th>
                      <th className="px-3 py-2">Serial Numbers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemRows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-2">{row.slNo}</td>
                        <td className="px-3 py-2"><input type="text" placeholder="Item" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                        <td className="px-3 py-2"><input type="text" placeholder="Unit" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                        <td className="px-3 py-2"><input type="text" placeholder="Value per unit for new" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                        <td className="px-3 py-2"><input type="text" placeholder="Eg: 20" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                        <td className="px-3 py-2"><input type="text" placeholder="Eg: 20" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                        <td className="px-3 py-2"><input type="text" placeholder="Serial Numbers" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addItemRow} className="mt-2 text-sm text-blue-600 hover:underline">+ Add row</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
