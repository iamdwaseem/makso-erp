"use client";

import { useState } from "react";
import { supplierRatesMock, type SupplierRate } from "@/mock/purchaseSettings";

export default function SupplierRateTrackingSettingsPage() {
  const [list, setList] = useState<SupplierRate[]>(supplierRatesMock);
  const [showForm, setShowForm] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [item, setItem] = useState("");
  const [rate, setRate] = useState("");
  const [unit, setUnit] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier.trim() || !item.trim() || !rate) return;
    setList((prev) => [...prev, { id: prev.length + 1, supplier: supplier.trim(), item: item.trim(), rate: Number(rate), unit: unit.trim() || "PCS", updatedOn: new Date().toLocaleDateString() }]);
    setSupplier("");
    setItem("");
    setRate("");
    setUnit("");
    setShowForm(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">SUPPLIER RATE TRACKING</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowForm(true)} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
          <button type="button" className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">EXPORT</button>
        </div>
      </div>
      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">New / Update Supplier Rate</h3>
          <form onSubmit={handleSave} className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Supplier *</label>
              <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Item *</label>
              <input type="text" value={item} onChange={(e) => setItem(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Rate *</label>
              <input type="number" step="any" value={rate} onChange={(e) => setRate(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Unit</label>
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" placeholder="PCS" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Updated on</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3">{row.id}</td>
                <td className="px-4 py-3 font-medium">{row.supplier}</td>
                <td className="px-4 py-3">{row.item}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.rate.toLocaleString()}</td>
                <td className="px-4 py-3">{row.unit}</td>
                <td className="px-4 py-3">{row.updatedOn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
