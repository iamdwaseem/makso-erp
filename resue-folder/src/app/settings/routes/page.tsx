"use client";

import { useState } from "react";
import { routesMock, type Route, type RouteStatus } from "@/mock/routes";
import SettingsTable, { type ColumnDef } from "@/components/settings/SettingsTable";
import SettingsForm from "@/components/settings/SettingsForm";

const STATUS_OPTIONS: RouteStatus[] = ["Active", "Inactive"];

export default function RoutesSettingsPage() {
  const [list, setList] = useState<Route[]>(routesMock);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [routeName, setRouteName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<RouteStatus>("Active");

  const resetForm = () => {
    setEditing(null);
    setRouteName("");
    setDescription("");
    setStatus("Active");
    setShowForm(false);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: Route) => {
    setEditing(row);
    setRouteName(row.routeName);
    setDescription(row.description ?? "");
    setStatus(row.status);
    setShowForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim()) return;
    if (editing) {
      setList((prev) =>
        prev.map((r) =>
          r.id === editing.id
            ? { ...r, routeName: routeName.trim(), description: description.trim() || null, status }
            : r
        )
      );
    } else {
      setList((prev) => [
        ...prev,
        {
          id: Math.max(0, ...prev.map((x) => x.id)) + 1,
          routeName: routeName.trim(),
          description: description.trim() || null,
          status,
        },
      ]);
    }
    resetForm();
  };

  const handleDelete = (row: Route) => {
    if (typeof window !== "undefined" && window.confirm("Delete this route?")) {
      setList((prev) => prev.filter((r) => r.id !== row.id));
    }
  };

  const columns: ColumnDef<Route>[] = [
    { key: "routeName", label: "Route Name" },
    { key: "description", label: "Description", render: (r) => r.description ?? "—" },
    { key: "status", label: "Status" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">ROUTES</h1>
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
        Define delivery or sales routes for customer segmentation. Click NEW to create a route.
      </p>
      {showForm && (
        <SettingsForm title={editing ? "Edit Route" : "New Route"} onSave={handleSave} onCancel={resetForm}>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Route Name *</label>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="rounded border border-gray-200 px-3 py-2 text-sm"
              placeholder="Route name"
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
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RouteStatus)}
              className="rounded border border-gray-200 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </SettingsForm>
      )}
      <SettingsTable columns={columns} data={list} onEdit={openEdit} onDelete={handleDelete} />
    </div>
  );
}
