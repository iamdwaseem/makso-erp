"use client";

import { useCallback, useEffect, useState } from "react";
import SupplierTable from "@/components/purchase/suppliers/SupplierTable";
import SupplierFilters from "@/components/purchase/suppliers/SupplierFilters";
import SupplierForm, { type SupplierFormData } from "@/components/purchase/suppliers/SupplierForm";
import { api, type ApiSupplier } from "@/lib/api";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ApiSupplier | null>(null);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSuppliers({ page: 1, limit: 100, search: supplierName.trim() || undefined });
      setSuppliers(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load suppliers");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [supplierName]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const filteredSuppliers = suppliers.filter((s) => {
    if (supplierName && !s.name.toLowerCase().includes(supplierName.toLowerCase())) return false;
    return true;
  });

  const handleNewSupplier = () => {
    setEditingSupplier(null);
    setFormOpen(true);
  };

  const handleEdit = (supplier: ApiSupplier) => {
    setEditingSupplier(supplier);
    setFormOpen(true);
  };

  const handleDelete = async (supplier: ApiSupplier) => {
    if (typeof window !== "undefined" && !window.confirm(`Delete supplier "${supplier.name}"?`)) return;
    try {
      await api.deleteSupplier(supplier.id);
      await loadSuppliers();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleSave = async (data: SupplierFormData) => {
    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          address: data.address || undefined,
        });
      } else {
        await api.createSupplier({
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          address: data.address || undefined,
        });
      }
      setFormOpen(false);
      setEditingSupplier(null);
      await loadSuppliers();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">SUPPLIER</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleNewSupplier}
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            NEW
          </button>
          <button
            type="button"
            className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            EXPORT
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
        <SupplierFilters
          supplierName={supplierName}
          onSupplierNameChange={setSupplierName}
          status="all"
          onStatusChange={() => {}}
          countryBranch=""
          onCountryBranchChange={() => {}}
          contactPerson=""
          onContactPersonChange={() => {}}
        />
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading…
        </div>
      ) : (
        <SupplierTable
          suppliers={filteredSuppliers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-4 text-white">
              <h2 className="text-lg font-semibold uppercase">
                {editingSupplier ? "Edit Supplier" : "NEW SUPPLIER"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setEditingSupplier(null);
                }}
                className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SupplierForm
              initialData={editingSupplier}
              onSave={handleSave}
              onReset={() => {}}
              onCancel={() => {
                setFormOpen(false);
                setEditingSupplier(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
