"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type MaterialRequestFormProps = {
  onSave: () => void;
  onSaveAndApprove: () => void;
  onReset: () => void;
  onCancel: () => void;
};

export default function MaterialRequestForm({ onSave, onSaveAndApprove, onReset, onCancel }: MaterialRequestFormProps) {
  const [date, setDate] = useState("09/11/2021 12:08 AM");
  const [requestFor, setRequestFor] = useState("");
  const [forCenter, setForCenter] = useState("");
  const [employee, setEmployee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [itemRows, setItemRows] = useState([{ slNo: 1, item: "", quantity: "", unit: "" }]);

  const addRow = () => {
    setItemRows((prev) => [...prev, { slNo: prev.length + 1, item: "", quantity: "", unit: "" }]);
  };

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">REQUEST FOR *</label>
          <div className="flex gap-1">
            <input type="text" value={requestFor} onChange={(e) => setRequestFor(e.target.value)} placeholder="Request For *" className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm" />
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">FOR CENTER</label>
          <input type="text" value={forCenter} onChange={(e) => setForCenter(e.target.value)} placeholder="Center" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">EMPLOYEE</label>
          <input type="text" value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder="Employee" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">DUE DATE</label>
          <div className="flex gap-1">
            <input type="text" value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="dd/mm/yyyy" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
            <span className="flex items-center rounded border border-gray-200 bg-gray-50 px-2 text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </span>
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
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Quantity</th>
                <th className="px-3 py-2">Unit</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.map((row, i) => (
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
        <button type="button" onClick={addRow} className="mt-2 text-sm text-blue-600 hover:underline">+ Add row</button>
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <button type="button" onClick={onCancel} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="button" onClick={onReset} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Reset</button>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
        <button type="button" onClick={onSaveAndApprove} className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">Save And Approve</button>
      </div>
    </form>
  );
}
