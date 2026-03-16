"use client";

import { useState } from "react";
import type { ApiSupplier } from "@/lib/api";

export type SupplierFormData = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

const emptyForm: SupplierFormData = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

type SupplierFormProps = {
  initialData?: ApiSupplier | null;
  onSave: (data: SupplierFormData) => void;
  onReset: () => void;
  onCancel: () => void;
};

export default function SupplierForm({
  initialData,
  onSave,
  onReset,
  onCancel,
}: SupplierFormProps) {
  const [form, setForm] = useState<SupplierFormData>(
    initialData
      ? {
          name: initialData.name,
          phone: initialData.phone,
          email: initialData.email ?? "",
          address: initialData.address ?? "",
        }
      : emptyForm
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const handleReset = () => {
    setForm(initialData ? { name: initialData.name, phone: initialData.phone, email: initialData.email ?? "", address: initialData.address ?? "" } : emptyForm);
    onReset();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        <div>
          <h2 className="text-lg font-semibold uppercase text-gray-800">
            {initialData ? "Edit Supplier" : "New Supplier"}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
                Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Supplier name"
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
                Phone <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone"
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Address"
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
}
