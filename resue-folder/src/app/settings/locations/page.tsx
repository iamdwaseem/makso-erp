"use client";

import { useState } from "react";
import { locationsMock, type Location, type LocationStatus } from "@/mock/locations";
import SettingsTable, { type ColumnDef } from "@/components/settings/SettingsTable";
import SettingsForm from "@/components/settings/SettingsForm";

const LOCATION_TYPES = ["Head Office", "Branch", "Warehouse", "Other"];
const STATUS_OPTIONS: LocationStatus[] = ["Active", "Inactive"];

export default function LocationsSettingsPage() {
  const [list, setList] = useState<Location[]>(locationsMock);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState("");
  const [locationType, setLocationType] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<LocationStatus>("Active");

  const resetForm = () => {
    setEditing(null);
    setLocationName("");
    setLocationType("");
    setDescription("");
    setStatus("Active");
    setShowForm(false);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: Location) => {
    setEditing(row);
    setLocationName(row.locationName);
    setLocationType(row.locationType);
    setDescription(row.description ?? "");
    setStatus(row.status);
    setShowForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim()) return;
    if (editing) {
      setList((prev) =>
        prev.map((r) =>
          r.id === editing.id
            ? { ...r, locationName: locationName.trim(), locationType: locationType.trim() || "Other", description: description.trim() || null, status }
            : r
        )
      );
    } else {
      setList((prev) => [
        ...prev,
        {
          id: Math.max(0, ...prev.map((x) => x.id)) + 1,
          locationName: locationName.trim(),
          locationType: locationType.trim() || "Other",
          description: description.trim() || null,
          status,
        },
      ]);
    }
    resetForm();
  };

  const handleDelete = (row: Location) => {
    if (typeof window !== "undefined" && window.confirm("Delete this location?")) {
      setList((prev) => prev.filter((r) => r.id !== row.id));
    }
  };

  const columns: ColumnDef<Location>[] = [
    { key: "locationName", label: "Location Name" },
    { key: "locationType", label: "Location Type" },
    { key: "description", label: "Description", render: (r) => r.description ?? "—" },
    { key: "status", label: "Status" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">LOCATIONS</h1>
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
        Manage business locations used across the app. Click NEW to add a location and set location type.
      </p>
      {showForm && (
        <SettingsForm title={editing ? "Edit Location" : "New Location"} onSave={handleSave} onCancel={resetForm}>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Location Name *</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="rounded border border-gray-200 px-3 py-2 text-sm"
              placeholder="Location name"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Location Type</label>
            <select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              className="rounded border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              {LOCATION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
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
              onChange={(e) => setStatus(e.target.value as LocationStatus)}
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
