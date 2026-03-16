"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export default function InventoryConversionPage() {
  const [date, setDate] = useState("05/16/2022 11:03 PM");
  const [employeeInCharge, setEmployeeInCharge] = useState("");
  const [notes, setNotes] = useState("");
  const [center, setCenter] = useState("");
  const [costMethod, setCostMethod] = useState("");
  const [outputRows, setOutputRows] = useState([{ slNo: 1, item: "", quantity: "", unit: "" }]);
  const [inputRows, setInputRows] = useState([{ slNo: 1, item: "", quantity: "", unit: "" }]);

  const addOutputRow = () => {
    setOutputRows((prev) => [...prev, { slNo: prev.length + 1, item: "", quantity: "", unit: "" }]);
  };
  const addInputRow = () => {
    setInputRows((prev) => [...prev, { slNo: prev.length + 1, item: "", quantity: "", unit: "" }]);
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
        <h1 className="text-lg font-semibold uppercase">NEW INVENTORY CONVERSION</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Save</button>
          <button type="button" className="rounded bg-blue-700 px-3 py-1.5 text-sm text-white hover:bg-blue-800">Save And Approve</button>
          <button type="button" className="rounded border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10">Reset</button>
          <button type="button" className="rounded border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10">Cancel</button>
          <button type="button" className="rounded p-2 text-white/90 hover:bg-white/10" aria-label="Close">
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
            <label className="mb-1 block text-xs font-medium uppercase text-gray-600">EMPLOYEE IN CHARGE</label>
            <input type="text" value={employeeInCharge} onChange={(e) => setEmployeeInCharge(e.target.value)} placeholder="Employee in charge" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase text-gray-600">NOTES</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-gray-600">CENTER *</label>
            <input type="text" value={center} onChange={(e) => setCenter(e.target.value)} placeholder="Center" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-gray-600">COST METHOD *</label>
            <input type="text" value={costMethod} onChange={(e) => setCostMethod(e.target.value)} placeholder="Method" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold uppercase text-gray-700">Products Obtained</h3>
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-3 py-2">Sl Num</th>
                  <th className="px-3 py-2">Item *</th>
                  <th className="px-3 py-2">Quantity *</th>
                  <th className="px-3 py-2">Unit</th>
                </tr>
              </thead>
              <tbody>
                {outputRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-3 py-2">{row.slNo}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <input type="text" placeholder="Item" className="min-w-0 flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm" />
                        <button type="button" className="shrink-0 rounded bg-blue-600 p-1 text-white"><Plus className="h-4 w-4" /></button>
                      </div>
                    </td>
                    <td className="px-3 py-2"><input type="text" placeholder="Quantity" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                    <td className="px-3 py-2"><input type="text" placeholder="Unit" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addOutputRow} className="mt-2 text-sm text-blue-600 hover:underline">+ Add row</button>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase text-gray-700">Inventory Inputs (Consumed)</h3>
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-3 py-2">Sl Num</th>
                  <th className="px-3 py-2">Item *</th>
                  <th className="px-3 py-2">Quantity *</th>
                  <th className="px-3 py-2">Unit *</th>
                </tr>
              </thead>
              <tbody>
                {inputRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-3 py-2">{row.slNo}</td>
                    <td className="px-3 py-2"><input type="text" placeholder="Item" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                    <td className="px-3 py-2"><input type="text" placeholder="Quantity" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                    <td className="px-3 py-2"><input type="text" placeholder="Unit" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addInputRow} className="mt-2 text-sm text-blue-600 hover:underline">+ Add row</button>
        </div>
      </div>
    </div>
  );
}
