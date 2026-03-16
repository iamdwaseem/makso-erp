"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { SearchCombobox } from "@/components/SearchCombobox";

export type GdnCreatePayload = {
  warehouseId: string;
  customerId?: string;
  items: { variantId: string; quantity: number }[];
};

type Props = {
  onSave: (payload: GdnCreatePayload) => void;
  onCancel: () => void;
};

export default function DeliveryNoteForm({ onSave, onCancel }: Props) {
  const [warehouseId, setWarehouseId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [itemRows, setItemRows] = useState<{ variantId: string; quantity: string }[]>([{ variantId: "", quantity: "" }]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchWarehouses = useCallback(async (query: string, limit: number) => {
    const list = await api.getWarehouses({ limit: 100 });
    const q = query.trim().toLowerCase();
    const filtered = q
      ? list.filter((w) => w.name.toLowerCase().includes(q))
      : list;
    return filtered.slice(0, limit).map((w) => ({ id: w.id, label: w.name }));
  }, []);

  const getWarehouseLabel = useCallback(async (id: string) => {
    const w = await api.getWarehouseById(id);
    return w.name;
  }, []);

  const fetchCustomers = useCallback(async (query: string, limit: number) => {
    const res = await api.getCustomers({ search: query, limit, page: 1 });
    const data = (res as { data?: { id: string; name: string; phone?: string }[] })?.data ?? [];
    return data.map((c) => ({ id: c.id, label: `${c.name}${c.phone ? ` (${c.phone})` : ""}` }));
  }, []);

  const getCustomerLabel = useCallback(async (id: string) => {
    const c = await api.getCustomerById(id);
    return `${c.name}${c.phone ? ` (${c.phone})` : ""}`;
  }, []);

  const fetchVariants = useCallback(async (query: string, limit: number) => {
    const res = await api.getVariants({ page: 1, limit, search: query.trim() || undefined });
    const data = (res as { data?: { id: string; sku: string; color?: string; product?: { name: string } }[] })?.data ?? [];
    return data.map((v) => ({
      id: v.id,
      label: `${v.product?.name ?? "Product"} — ${v.color ?? ""} (${v.sku})`.trim(),
    }));
  }, []);

  const getVariantLabel = useCallback(async (id: string) => {
    const v = await api.getVariantById(id);
    const name = (v as { product?: { name: string } }).product?.name ?? "Product";
    const color = (v as { color?: string }).color ?? "";
    const sku = (v as { sku: string }).sku;
    return `${name} — ${color} (${sku})`.trim();
  }, []);

  const addRow = () => {
    setItemRows((prev) => [...prev, { variantId: "", quantity: "" }]);
  };

  const setRow = (index: number, field: "variantId" | "quantity", value: string) => {
    setItemRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const buildPayload = (): GdnCreatePayload | null => {
    if (!warehouseId) return null;
    const items = itemRows
      .map((r) => ({ variantId: r.variantId.trim(), quantity: parseInt(r.quantity, 10) }))
      .filter((i) => i.variantId && !Number.isNaN(i.quantity) && i.quantity > 0);
    if (items.length === 0) return null;
    return { warehouseId, customerId: customerId || undefined, items };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const payload = buildPayload();
    if (!payload) {
      setSubmitError("Select warehouse and add at least one item with variant and quantity.");
      return;
    }
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">Warehouse *</label>
          <SearchCombobox
            fetchItems={fetchWarehouses}
            getLabel={getWarehouseLabel}
            value={warehouseId}
            onChange={setWarehouseId}
            placeholder="Search warehouse..."
            minChars={0}
            limit={20}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">Customer</label>
          <SearchCombobox
            fetchItems={fetchCustomers}
            getLabel={getCustomerLabel}
            value={customerId}
            onChange={setCustomerId}
            placeholder="Optional — search customer..."
            minChars={2}
            limit={15}
          />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase text-gray-700">Delivery items</h3>
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Variant</th>
                <th className="px-3 py-2">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="min-w-[220px] px-3 py-2">
                    <SearchCombobox
                      fetchItems={fetchVariants}
                      getLabel={getVariantLabel}
                      value={row.variantId}
                      onChange={(id) => setRow(i, "variantId", id)}
                      placeholder="Search product / SKU... (or click to list)"
                      minChars={0}
                      limit={15}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => setRow(i, "quantity", e.target.value)}
                      className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={addRow} className="mt-2 text-sm text-blue-600 hover:underline">+ Add row</button>
      </div>
      {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <button type="button" onClick={onCancel} className="rounded border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
      </div>
    </form>
  );
}
