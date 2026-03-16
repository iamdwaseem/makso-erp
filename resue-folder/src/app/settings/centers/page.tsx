"use client";

import { useState } from "react";
import { centersMock, type Center, type CenterStatus } from "@/mock/centers";
import { locationsMock } from "@/mock/locations";
import SettingsTable, { type ColumnDef } from "@/components/settings/SettingsTable";
import SettingsForm from "@/components/settings/SettingsForm";

const CENTER_TYPES = ["Warehouse", "Head Office", "Branch", "Vehicle", "Other"];
const STATUS_OPTIONS: CenterStatus[] = ["Active", "Inactive"];

export default function CentersSettingsPage() {
  const [list, setList] = useState<Center[]>(centersMock);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Center | null>(null);
  const [centerName, setCenterName] = useState("");
  const [centerType, setCenterType] = useState("");
  const [locationId, setLocationId] = useState<number>(locationsMock[0]?.id ?? 0);
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<CenterStatus>("Active");

  const resetForm = () => {
    setEditing(null);
    setCenterName("");
    setCenterType("");
    setLocationId(locationsMock[0]?.id ?? 0);
    setAddress("");
    setStatus("Active");
    setShowForm(false);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: Center) => {
    setEditing(row);
    setCenterName(row.centerName);
    setCenterType(row.centerType);
    setLocationId(row.locationId);
    setAddress(row.address ?? "");
    setStatus(row.status);
    setShowForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerName.trim()) return;
    const location = locationsMock.find((l) => l.id === locationId);
    const locationName = location?.locationName ?? "";
    if (editing) {
      setList((prev) =>
        prev.map((r) =>
          r.id === editing.id
            ? { ...r, centerName: centerName.trim(), centerType: centerType.trim() || "Other", locationId, locationName, address: address.trim() || null, status }
            : r
        )
      );
    } else {
      setList((prev) => [
        ...prev,
        {
          id: Math.max(0, ...prev.map((x) => x.id)) + 1,
          centerName: centerName.trim(),
          centerType: centerType.trim() || "Other",
          address: address.trim() || null,
          locationId,
          locationName,
          status,
        },
      ]);
    }
    resetForm();
  };

  const handleDelete = (row: Center) => {
    if (typeof window !== "undefined" && window.confirm("Delete this center?")) {
      setList((prev) => prev.filter((r) => r.id !== row.id));
    }
  };

  const columns: ColumnDef<Center>[] = [
    { key: "centerName", label: "Center Name" },
    { key: "centerType", label: "Center Type" },
    { key: "address", label: "Address", render: (r) => r.address ?? "—" },
    { key: "locationName", label: "Location" },
    { key: "status", label: "Status" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">CENTERS</h1>
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
        Create company centers such as warehouses, branches, and offices. Click NEW to add a center and set type and address.
      </p>
      {showForm && (
        <SettingsForm title={editing ? "Edit Center" : "New Center"} onSave={handleSave} onCancel={resetForm}>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Center Name *</label>
            <input
              type="text"
              value={centerName}
              onChange={(e) => setCenterName(e.target.value)}
              className="rounded border border-gray-200 px-3 py-2 text-sm"
              placeholder="Center name"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Center Type</label>
            <select
              value={centerType}
              onChange={(e) => setCenterType(e.target.value)}
              className="rounded border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              {CENTER_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(Number(e.target.value))}
              className="rounded border border-gray-200 px-3 py-2 text-sm"
            >
              {locationsMock.map((l) => (
                <option key={l.id} value={l.id}>{l.locationName}</option>
              ))}
            </select>
          </div>
          <div className="w-full">
            <label className="mb-1 block text-xs font-medium text-gray-600">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CenterStatus)}
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
