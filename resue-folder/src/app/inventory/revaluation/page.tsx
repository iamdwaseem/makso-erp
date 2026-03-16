"use client";

import { useState } from "react";
import { inventoryRevaluationsMock } from "@/mock/inventoryRevaluation";
import { Search } from "lucide-react";

export default function InventoryRevaluationPage() {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("17/10/2021");
  const [type, setType] = useState("");
  const [onAccount, setOnAccount] = useState("");
  const [notes, setNotes] = useState("");
  const [itemRows, setItemRows] = useState([{ slNo: 1, item: "", itemType: "", center: "", moreValue: "", lessValue: "" }]);

  const addItemRow = () => {
    setItemRows((prev) => [...prev, { slNo: prev.length + 1, item: "", itemType: "", center: "", moreValue: "", lessValue: "" }]);
  };

  return (
    <div className="p-6">
      {!showForm ? (
        <>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">INVENTORY REVALUATION</h1>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(true)} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
              <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">EXPORT</button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">On Account</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {inventoryRevaluationsMock.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3">{row.id}</td>
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3">{row.type}</td>
                    <td className="px-4 py-3">{row.onAccount}</td>
                    <td className="px-4 py-3">{row.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
            <h1 className="text-lg font-semibold uppercase">NEW INVENTORY REVALUATION</h1>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Save</button>
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
                <label className="mb-1 block text-xs font-medium uppercase text-gray-600">TYPE *</label>
                <input type="text" value={type} onChange={(e) => setType(e.target.value)} placeholder="Type *" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
                <p className="mt-1 text-xs text-red-600">Field is required</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-600">ON ACCOUNT *</label>
                <div className="flex gap-1">
                  <input type="text" value={onAccount} onChange={(e) => setOnAccount(e.target.value)} placeholder="Account" className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm" />
                  <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Search className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase text-gray-600">NOTES</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
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
                      <th className="px-3 py-2">Item Type</th>
                      <th className="px-3 py-2">Center *</th>
                      <th className="px-3 py-2">More Value</th>
                      <th className="px-3 py-2">Less Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemRows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-2">{row.slNo}</td>
                        <td className="px-3 py-2"><input type="text" placeholder="Item" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                        <td className="px-3 py-2"><input type="text" placeholder="Item Types" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                        <td className="px-3 py-2"><input type="text" placeholder="Center" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                        <td className="px-3 py-2"><input type="text" placeholder="More Value" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                        <td className="px-3 py-2"><input type="text" placeholder="Less Value" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
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
