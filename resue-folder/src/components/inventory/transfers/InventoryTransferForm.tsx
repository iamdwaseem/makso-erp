"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export type TransferCreatePayload = {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  items: { variantId: string; quantity: number }[];
};

type InventoryTransferFormProps = {
  onSave: (payload: TransferCreatePayload) => void;
  onSaveAndApprove: (payload: TransferCreatePayload) => void;
  onReset: () => void;
  onCancel: () => void;
};

export default function InventoryTransferForm({ onSave, onSaveAndApprove, onReset, onCancel }: InventoryTransferFormProps) {
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [variants, setVariants] = useState<{ id: string; sku: string }[]>([]);
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [targetWarehouseId, setTargetWarehouseId] = useState("");
  const [itemRows, setItemRows] = useState<{ variantId: string; quantity: string }[]>([{ variantId: "", quantity: "" }]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    api.getWarehouses().then((list) => setWarehouses(list)).catch(() => setWarehouses([]));
    api.getVariants({ page: 1, limit: 200 }).then((res: any) => setVariants(res?.data ?? [])).catch(() => setVariants([]));
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

  const buildPayload = (): TransferCreatePayload | null => {
    if (!sourceWarehouseId || !targetWarehouseId || sourceWarehouseId === targetWarehouseId) return null;
    const items = itemRows
      .map((r) => ({ variantId: r.variantId.trim(), quantity: parseInt(r.quantity, 10) }))
      .filter((i) => i.variantId && !Number.isNaN(i.quantity) && i.quantity > 0);
    if (items.length === 0) return null;
    return { sourceWarehouseId, targetWarehouseId, items };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const payload = buildPayload();
    if (!payload) {
      setSubmitError("Select from/to warehouses and add at least one item with variant and quantity.");
      return;
    }
    onSave(payload);
  };

  const handleSaveAndApprove = () => {
    setSubmitError(null);
    const payload = buildPayload();
    if (!payload) {
      setSubmitError("Select from/to warehouses and add at least one item with variant and quantity.");
      return;
    }
    onSaveAndApprove(payload);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">FROM CENTER *</label>
          <select
            value={sourceWarehouseId}
            onChange={(e) => setSourceWarehouseId(e.target.value)}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Select warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">TO CENTER *</label>
          <select
            value={targetWarehouseId}
            onChange={(e) => setTargetWarehouseId(e.target.value)}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Select warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase text-gray-700">ITEMS</h3>
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
                  <td className="px-3 py-2">
                    <select
                      value={row.variantId}
                      onChange={(e) => setRow(i, "variantId", e.target.value)}
                      className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                    >
                      <option value="">Select variant</option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>{v.sku}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => setRow(i, "quantity", e.target.value)}
                      placeholder="Qty"
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
        <button type="button" onClick={onCancel} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="button" onClick={onReset} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Reset</button>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
        <button type="button" onClick={handleSaveAndApprove} className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">Save And Approve</button>
      </div>
    </form>
  );
}
