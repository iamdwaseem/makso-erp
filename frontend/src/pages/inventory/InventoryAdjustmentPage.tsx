import { useCallback, useEffect, useState } from "react";
import api from "../../api";
import { useWarehouseStore } from "../../store/warehouseStore";
import { SearchCombobox } from "../../components/SearchCombobox";

export function InventoryAdjustmentPage() {
  const { warehouses, currentWarehouseId } = useWarehouseStore();
  const [variantId, setVariantId] = useState("");
  const [warehouseId, setWarehouseId] = useState(currentWarehouseId === "all" ? "" : currentWarehouseId);
  const [action, setAction] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (currentWarehouseId && currentWarehouseId !== "all") setWarehouseId(currentWarehouseId);
  }, [currentWarehouseId]);

  const loadWarehouses = useCallback(async () => {
    try {
      const res = await api.get("/warehouses");
      const list = res.data?.data ?? res.data ?? [];
      useWarehouseStore.getState().setWarehouses(Array.isArray(list) ? list : []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantId || !warehouseId || quantity < 1) {
      setMessage({ type: "error", text: "Select variant, warehouse, and enter a positive quantity." });
      return;
    }
    if (warehouseId === "all") {
      setMessage({ type: "error", text: "Please select a specific warehouse." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await api.post("/inventory/adjust", {
        variant_id: variantId,
        warehouse_id: warehouseId,
        action,
        quantity,
        reference_type: "ADJUSTMENT",
        reference_id: crypto.randomUUID(),
      });
      setMessage({ type: "success", text: "Adjustment applied successfully." });
      setQuantity(1);
    } catch (err: any) {
      const text = err.response?.data?.error ?? err.response?.data?.message ?? err.message ?? "Failed to apply adjustment.";
      setMessage({ type: "error", text });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">Inventory Adjustment</h1>
      <div className="max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Variant (item)</label>
            <SearchCombobox
              endpoint="/variants"
              mapItem={(v: any) => ({ id: v.id, label: `${v.product?.name ?? ""} — ${v.color ?? ""} (${v.sku ?? v.id})` })}
              value={variantId}
              onChange={setVariantId}
              placeholder="Search variant..."
              accentClass="focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Direction</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as "IN" | "OUT")}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="IN">Stock IN</option>
              <option value="OUT">Stock OUT</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          {message && (
            <div
              className={`rounded px-3 py-2 text-sm ${
                message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Applying…" : "Apply adjustment"}
          </button>
        </form>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Adjustments are recorded in the inventory ledger. View movement in History or in the variant ledger from Inventory → Items.
      </p>
    </div>
  );
}
