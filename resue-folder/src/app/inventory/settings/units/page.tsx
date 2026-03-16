"use client";

import { useState } from "react";
import { unitsMock, type Unit } from "@/mock/inventorySettings";

export default function UnitsSettingsPage() {
  const [list, setList] = useState<Unit[]>(unitsMock);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [shortForm, setShortForm] = useState("");
  const [decimalPlaces, setDecimalPlaces] = useState(0);
  const [baseUnit, setBaseUnit] = useState("");
  const [multiplier, setMultiplier] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortForm.trim()) return;
    setList((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: name.trim(),
        shortForm: shortForm.trim(),
        decimalPlaces: Number(decimalPlaces) || 0,
        baseUnit: baseUnit.trim() || undefined,
        multiplier: multiplier ? Number(multiplier) : undefined,
      },
    ]);
    setName("");
    setShortForm("");
    setDecimalPlaces(0);
    setBaseUnit("");
    setMultiplier("");
    setShowForm(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">UNITS</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowForm(true)} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
          <button type="button" className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">EXPORT</button>
        </div>
      </div>
      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">New Unit</h3>
          <form onSubmit={handleSave} className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" placeholder="e.g. Piece" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Short form *</label>
              <input type="text" value={shortForm} onChange={(e) => setShortForm(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" placeholder="e.g. PCS" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Decimal places</label>
              <input type="number" min={0} value={decimalPlaces} onChange={(e) => setDecimalPlaces(Number(e.target.value))} className="rounded border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Base unit</label>
              <input type="text" value={baseUnit} onChange={(e) => setBaseUnit(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" placeholder="If not base unit" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Multiplier</label>
              <input type="text" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" placeholder="e.g. 12" />
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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Short form</th>
              <th className="px-4 py-3">Decimal places</th>
              <th className="px-4 py-3">Base unit</th>
              <th className="px-4 py-3">Multiplier</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3">{row.id}</td>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3">{row.shortForm}</td>
                <td className="px-4 py-3">{row.decimalPlaces}</td>
                <td className="px-4 py-3">{row.baseUnit ?? "—"}</td>
                <td className="px-4 py-3">{row.multiplier ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
