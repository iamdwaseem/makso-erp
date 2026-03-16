"use client";

import { useState } from "react";
import { purchaseTypesMock, type PurchaseType } from "@/mock/purchaseSettings";

export default function PurchaseTypesSettingsPage() {
  const [list, setList] = useState<PurchaseType[]>(purchaseTypesMock);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setList((prev) => [...prev, { id: prev.length + 1, name: name.trim(), code: code.trim() || undefined }]);
    setName("");
    setCode("");
    setShowForm(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">PURCHASE TYPES</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowForm(true)} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
          <button type="button" className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">EXPORT</button>
        </div>
      </div>
      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">New Purchase Type</h3>
          <form onSubmit={handleSave} className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Code</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
              <button type="button" onClick={() => { setShowForm(false); setName(""); setCode(""); }} className="rounded border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
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
              <th className="px-4 py-3">Code</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3">{row.id}</td>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3">{row.code ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
