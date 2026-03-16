"use client";

import { useState } from "react";
import { openingInventoryMock, type OpeningInventory } from "@/mock/inventorySettings";

export default function OpeningInventorySettingsPage() {
  const [list, setList] = useState<OpeningInventory[]>(openingInventoryMock);
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState("");
  const [center, setCenter] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [value, setValue] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim() || !center.trim() || !unit.trim() || !quantity || !value) return;
    setList((prev) => [...prev, { id: prev.length + 1, item: item.trim(), center: center.trim(), unit: unit.trim(), quantity: Number(quantity), value: Number(value) }]);
    setItem("");
    setCenter("");
    setUnit("");
    setQuantity("");
    setValue("");
    setShowForm(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">OPENING INVENTORY</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowForm(true)} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
          <button type="button" className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">EXPORT</button>
        </div>
      </div>
      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">New Opening Inventory</h3>
          <form onSubmit={handleSave} className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Item *</label>
              <input type="text" value={item} onChange={(e) => setItem(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Center *</label>
              <input type="text" value={center} onChange={(e) => setCenter(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Unit *</label>
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Quantity *</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Value / Cost *</label>
              <input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" required />
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
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Center</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-right">Quantity</th>
              <th className="px-4 py-3 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3">{row.id}</td>
                <td className="px-4 py-3 font-medium">{row.item}</td>
                <td className="px-4 py-3">{row.center}</td>
                <td className="px-4 py-3">{row.unit}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.quantity}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
