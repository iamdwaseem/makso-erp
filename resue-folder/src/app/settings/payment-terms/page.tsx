"use client";

import { useState } from "react";
import { paymentTermsMock, type PaymentTerm } from "@/mock/paymentTerms";
import SettingsTable, { type ColumnDef } from "@/components/settings/SettingsTable";
import SettingsForm from "@/components/settings/SettingsForm";

export default function PaymentTermsSettingsPage() {
  const [list, setList] = useState<PaymentTerm[]>(paymentTermsMock);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PaymentTerm | null>(null);
  const [termName, setTermName] = useState("");
  const [days, setDays] = useState<number>(0);
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setEditing(null);
    setTermName("");
    setDays(0);
    setDescription("");
    setShowForm(false);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: PaymentTerm) => {
    setEditing(row);
    setTermName(row.termName);
    setDays(row.days);
    setDescription(row.description ?? "");
    setShowForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termName.trim()) return;
    const daysNum = Math.max(0, Number.isNaN(days) ? 0 : days);
    if (editing) {
      setList((prev) =>
        prev.map((r) =>
          r.id === editing.id
            ? { ...r, termName: termName.trim(), days: daysNum, description: description.trim() || null }
            : r
        )
      );
    } else {
      setList((prev) => [
        ...prev,
        {
          id: Math.max(0, ...prev.map((x) => x.id)) + 1,
          termName: termName.trim(),
          days: daysNum,
          description: description.trim() || null,
        },
      ]);
    }
    resetForm();
  };

  const handleDelete = (row: PaymentTerm) => {
    if (typeof window !== "undefined" && window.confirm("Delete this payment term?")) {
      setList((prev) => prev.filter((r) => r.id !== row.id));
    }
  };

  const columns: ColumnDef<PaymentTerm>[] = [
    { key: "termName", label: "Term Name" },
    { key: "days", label: "Days" },
    { key: "description", label: "Description", render: (r) => r.description ?? "—" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">PAYMENT TERMS</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openNew}
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            NEW
          </button>
          <button
            type="button"
            className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            EXPORT
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm text-gray-600">
        Define payment schedules (e.g. 7 days, 15 days). Due dates are calculated automatically from the payment term.
      </p>
      {showForm && (
        <SettingsForm title={editing ? "Edit Payment Term" : "New Payment Term"} onSave={handleSave} onCancel={resetForm}>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Term Name *</label>
            <input
              type="text"
              value={termName}
              onChange={(e) => setTermName(e.target.value)}
              className="rounded border border-gray-200 px-3 py-2 text-sm"
              placeholder="e.g. Net 7"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Number of Days</label>
            <input
              type="number"
              min={0}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10) || 0)}
              className="rounded border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded border border-gray-200 px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </div>
        </SettingsForm>
      )}
      <SettingsTable columns={columns} data={list} onEdit={openEdit} onDelete={handleDelete} />
    </div>
  );
}
