"use client";

import { useState } from "react";
import { centerTypesMock, type CenterType } from "@/mock/centerTypes";
import SettingsTable, { type ColumnDef } from "@/components/settings/SettingsTable";
import SettingsForm from "@/components/settings/SettingsForm";

export default function CenterTypesSettingsPage() {
  const [list, setList] = useState<CenterType[]>(centerTypesMock);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CenterType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setShowForm(false);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: CenterType) => {
    setEditing(row);
    setName(row.name);
    setDescription(row.description ?? "");
    setShowForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      setList((prev) =>
        prev.map((r) =>
          r.id === editing.id ? { ...r, name: name.trim(), description: description.trim() || null } : r
        )
      );
    } else {
      setList((prev) => [
        ...prev,
        { id: Math.max(0, ...prev.map((x) => x.id)) + 1, name: name.trim(), description: description.trim() || null },
      ]);
    }
    resetForm();
  };

  const handleDelete = (row: CenterType) => {
    if (typeof window !== "undefined" && window.confirm("Delete this center type?")) {
      setList((prev) => prev.filter((r) => r.id !== row.id));
    }
  };

  const columns: ColumnDef<CenterType>[] = [
    { key: "name", label: "Center Type" },
    { key: "description", label: "Description", render: (r) => r.description ?? "—" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">CENTER TYPES</h1>
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
        Define types of centers (e.g. Warehouse, Head Office, Branch, Vehicle). Click NEW to add a center type.
      </p>
      {showForm && (
        <SettingsForm title={editing ? "Edit Center Type" : "New Center Type"} onSave={handleSave} onCancel={resetForm}>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Center Type Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded border border-gray-200 px-3 py-2 text-sm"
              placeholder="e.g. Warehouse"
              required
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
