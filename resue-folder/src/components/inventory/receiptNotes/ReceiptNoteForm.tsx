"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { SearchCombobox } from "@/components/SearchCombobox";
import { useScanner } from "@/hooks/useScanner";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";

export type GrnCreatePayload = {
  warehouseId: string;
  supplierId?: string;
  items: { variantId: string; quantity: number }[];
};

type CartRow = { id: string; variantId: string; quantity: string };

const makeRow = (): CartRow => ({ id: crypto.randomUUID(), variantId: "", quantity: "1" });

type Props = {
  onSave: (payload: GrnCreatePayload) => void;
  onCancel: () => void;
  /** When true, create GRN and submit in one go (stock in immediately, like Stock Entry). */
  submitImmediately?: boolean;
};

export default function ReceiptNoteForm({ onSave, onCancel, submitImmediately = true }: Props) {
  const { warehouseId: contextWarehouseId } = useGlobalFilter();
  const [warehouseId, setWarehouseId] = useState(contextWarehouseId && contextWarehouseId !== "all" ? contextWarehouseId : "");
  const [supplierMode, setSupplierMode] = useState<"existing" | "new">("existing");
  const [supplierId, setSupplierId] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");
  const [mode, setMode] = useState<"existing" | "variant" | "new">("existing");
  const [itemRows, setItemRows] = useState<CartRow[]>([makeRow()]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add variant mode
  const [selectedProductId, setSelectedProductId] = useState("");
  const [addVarColor, setAddVarColor] = useState("");
  const [addVarQty, setAddVarQty] = useState(1);
  // New product mode
  const [productName, setProductName] = useState("");
  const [newProductColor, setNewProductColor] = useState("");
  const [newProductQty, setNewProductQty] = useState(1);

  const effectiveWarehouseId = warehouseId || (contextWarehouseId !== "all" ? contextWarehouseId : "");

  const fetchWarehouses = useCallback(async (query: string, limit: number) => {
    const list = await api.getWarehouses({ limit: 100 });
    const q = query.trim().toLowerCase();
    const filtered = q ? list.filter((w) => w.name.toLowerCase().includes(q)) : list;
    return filtered.slice(0, limit).map((w) => ({ id: w.id, label: w.name }));
  }, []);

  const getWarehouseLabel = useCallback(async (id: string) => {
    const w = await api.getWarehouseById(id);
    return w.name;
  }, []);

  const fetchSuppliers = useCallback(async (query: string, limit: number) => {
    const res = await api.getSuppliers({ search: query, limit, page: 1 });
    const data = (res as { data?: { id: string; name: string; phone?: string }[] })?.data ?? [];
    return data.map((s) => ({ id: s.id, label: `${s.name}${s.phone ? ` (${s.phone})` : ""}` }));
  }, []);

  const getSupplierLabel = useCallback(async (id: string) => {
    const s = await api.getSupplierById(id);
    return `${s.name}${s.phone ? ` (${s.phone})` : ""}`;
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

  const fetchProducts = useCallback(async (query: string, limit: number) => {
    const res = await api.getProducts({ search: query, limit, page: 1 });
    const data = (res as { data?: { id: string; name: string }[] })?.data ?? [];
    return data.map((p) => ({ id: p.id, label: p.name }));
  }, []);

  const getProductLabel = useCallback(async (id: string) => {
    const p = await api.getProductById(id);
    return (p as { name: string }).name;
  }, []);

  const setRow = (index: number, field: "variantId" | "quantity", value: string) => {
    setItemRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => setItemRows((prev) => [...prev, makeRow()]);
  const removeRow = (id: string) =>
    setItemRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));

  useScanner(
    useCallback(
      (code: string) => {
        if (mode !== "existing") return;
        let promise: Promise<{ id: string }>;
        if (code.startsWith("VAR:")) {
          const variantId = code.replace("VAR:", "").trim();
          promise = api.getVariantById(variantId).then((v: any) => ({ id: v.id }));
        } else {
          promise = api.getVariantBySku(code).then((v: any) => ({ id: v.id }));
        }
        promise
          .then((v) => {
            setItemRows((prev) => {
              const firstEmpty = prev.find((r) => !r.variantId.trim());
              if (firstEmpty) {
                return prev.map((r) => (r.id === firstEmpty.id ? { ...r, variantId: v.id, quantity: "1" } : r));
              }
              const existing = prev.find((r) => r.variantId === v.id);
              if (existing) {
                return prev.map((r) =>
                  r.id === existing.id ? { ...r, quantity: String((parseInt(r.quantity, 10) || 0) + 1) } : r
                );
              }
              return [...prev, { ...makeRow(), variantId: v.id, quantity: "1" }];
            });
          })
          .catch(() => {});
      },
      [mode]
    )
  );

  const getOrCreateSupplierId = async (): Promise<string | null> => {
    if (supplierMode === "existing") {
      if (supplierId) return supplierId;
      return null;
    }
    if (!newSupplierName.trim() || !newSupplierPhone.trim()) return null;
    const res = await api.createSupplier({
      name: newSupplierName.trim(),
      phone: newSupplierPhone.trim(),
      address: newSupplierAddress.trim() || undefined,
    });
    return (res as { id: string }).id;
  };

  const buildPayload = (): GrnCreatePayload | null => {
    const wh = effectiveWarehouseId;
    if (!wh) return null;
    const items = itemRows
      .map((r) => ({ variantId: r.variantId.trim(), quantity: parseInt(r.quantity, 10) }))
      .filter((i) => i.variantId && !Number.isNaN(i.quantity) && i.quantity > 0);
    if (items.length === 0) return null;
    return { warehouseId: wh, supplierId: supplierId || undefined, items };
  };

  const handleSubmitExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    if (effectiveWarehouseId === "all" || !effectiveWarehouseId) {
      setSubmitError("Select a specific warehouse (use the header selector or choose below).");
      setSubmitting(false);
      return;
    }
    const supplierIdRes = await getOrCreateSupplierId();
    if (supplierMode === "existing" && !supplierId && !supplierIdRes) {
      setSubmitError("Select a supplier or add a new one.");
      setSubmitting(false);
      return;
    }
    const payload = buildPayload();
    if (!payload) {
      setSubmitError("Add at least one item with variant and quantity.");
      setSubmitting(false);
      return;
    }
    payload.supplierId = payload.supplierId || supplierIdRes || undefined;
    try {
      const grn = await api.createGrn(payload);
      if (submitImmediately && grn?.id) {
        await api.submitGrn(grn.id);
      }
      onSave(payload);
    } catch (err: any) {
      setSubmitError(err?.message ?? "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    if (!effectiveWarehouseId || effectiveWarehouseId === "all") {
      setSubmitError("Select a specific warehouse.");
      setSubmitting(false);
      return;
    }
    if (!selectedProductId || !addVarColor.trim()) {
      setSubmitError("Select product and enter color.");
      setSubmitting(false);
      return;
    }
    const supplierIdRes = await getOrCreateSupplierId();
    try {
      const variantRes = await api.createVariant({
        productId: selectedProductId,
        color: addVarColor.trim(),
      });
      const variantId = (variantRes as { id: string }).id;
      const payload: GrnCreatePayload = {
        warehouseId: effectiveWarehouseId,
        supplierId: supplierIdRes || undefined,
        items: [{ variantId, quantity: addVarQty }],
      };
      const grn = await api.createGrn(payload);
      if (submitImmediately && grn?.id) await api.submitGrn(grn.id);
      setSelectedProductId("");
      setAddVarColor("");
      setAddVarQty(1);
      onSave(payload);
    } catch (err: any) {
      setSubmitError(err?.message ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    if (!effectiveWarehouseId || effectiveWarehouseId === "all") {
      setSubmitError("Select a specific warehouse.");
      setSubmitting(false);
      return;
    }
    if (!productName.trim() || !newProductColor.trim()) {
      setSubmitError("Enter product name and color.");
      setSubmitting(false);
      return;
    }
    const supplierIdRes = await getOrCreateSupplierId();
    try {
      const productRes = await api.createProduct({ name: productName.trim() });
      const productId = (productRes as { id: string }).id;
      const variantRes = await api.createVariant({
        productId,
        color: newProductColor.trim(),
      });
      const variantId = (variantRes as { id: string }).id;
      const payload: GrnCreatePayload = {
        warehouseId: effectiveWarehouseId,
        supplierId: supplierIdRes || undefined,
        items: [{ variantId, quantity: newProductQty }],
      };
      const grn = await api.createGrn(payload);
      if (submitImmediately && grn?.id) await api.submitGrn(grn.id);
      setProductName("");
      setNewProductColor("");
      setNewProductQty(1);
      onSave(payload);
    } catch (err: any) {
      setSubmitError(err?.message ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const supplierSection = (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">From Supplier</label>
        <button
          type="button"
          onClick={() => setSupplierMode(supplierMode === "existing" ? "new" : "existing")}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          {supplierMode === "existing" ? "+ New supplier" : "Pick existing"}
        </button>
      </div>
      {supplierMode === "existing" ? (
        <SearchCombobox
          fetchItems={fetchSuppliers}
          getLabel={getSupplierLabel}
          value={supplierId}
          onChange={setSupplierId}
          placeholder="Search supplier..."
          minChars={0}
          limit={15}
        />
      ) : (
        <div className="space-y-2">
          <input
            value={newSupplierName}
            onChange={(e) => setNewSupplierName(e.target.value)}
            placeholder="Supplier Name *"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            value={newSupplierPhone}
            onChange={(e) => setNewSupplierPhone(e.target.value)}
            placeholder="Phone *"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            value={newSupplierAddress}
            onChange={(e) => setNewSupplierAddress(e.target.value)}
            placeholder="Address (optional)"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );

  const validItems = itemRows.filter((r) => r.variantId.trim() && parseInt(r.quantity, 10) >= 1);
  const cartCount = validItems.length;

  return (
    <div className="space-y-6">
      {/* Mode tabs (like frontend-example Stock Entry) */}
      <div className="flex gap-2">
        {(["existing", "variant", "new"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === m
                ? m === "existing"
                  ? "bg-blue-600 text-white"
                  : m === "variant"
                    ? "bg-indigo-600 text-white"
                    : "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {m === "existing" ? "Receive stock" : m === "variant" ? "+ Add variant" : "+ New product"}
          </button>
        ))}
      </div>

      {/* Warehouse (shared) */}
      <div>
        <label className="mb-1 block text-xs font-medium uppercase text-gray-600">Warehouse *</label>
        <SearchCombobox
          fetchItems={fetchWarehouses}
          getLabel={getWarehouseLabel}
          value={effectiveWarehouseId}
          onChange={setWarehouseId}
          placeholder="Search warehouse..."
          minChars={0}
          limit={20}
        />
        {effectiveWarehouseId === "all" && (
          <p className="mt-1 text-xs text-amber-600">Select a specific warehouse to receive stock.</p>
        )}
      </div>

      {/* —— Existing: Receive stock (cart) —— */}
      {mode === "existing" && (
        <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Receive stock</h3>
              <p className="text-xs text-gray-400 mt-0.5">Add items; scan barcode to add or increment. Then choose supplier and stock in.</p>
            </div>
            {cartCount > 0 && (
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {cartCount} item{cartCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_100px_36px] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-gray-500">
              <span>Product variant</span>
              <span>Qty</span>
              <span />
            </div>
            {itemRows.map((row, i) => (
              <div key={row.id} className="grid grid-cols-[1fr_100px_36px] gap-2 items-center">
                <SearchCombobox
                  fetchItems={fetchVariants}
                  getLabel={getVariantLabel}
                  value={row.variantId}
                  onChange={(id) => setRow(i, "variantId", id)}
                  placeholder={`Item ${i + 1}...`}
                  minChars={0}
                  limit={15}
                />
                <input
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) => setRow(i, "quantity", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={itemRows.length <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                  title="Remove row"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded px-1 py-1 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Add another item
            </button>
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-4 max-w-lg">
            {supplierSection}
            <button
              type="button"
              onClick={handleSubmitExisting}
              disabled={submitting || cartCount === 0}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Recording…" : `Stock in ${cartCount > 0 ? cartCount + " item(s)" : "—"}`}
            </button>
          </div>
        </div>
      )}

      {/* —— Add variant —— */}
      {mode === "variant" && (
        <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Add variant and stock in</h3>
          <p className="text-xs text-gray-400 mb-4">Add a new color/size to an existing product, then receive stock.</p>
          <form onSubmit={handleAddVariantSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <SearchCombobox
                fetchItems={fetchProducts}
                getLabel={getProductLabel}
                value={selectedProductId}
                onChange={setSelectedProductId}
                placeholder="Search product..."
                minChars={0}
                limit={15}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color / size *</label>
                <input
                  value={addVarColor}
                  onChange={(e) => setAddVarColor(e.target.value)}
                  placeholder="e.g. Red"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={addVarQty}
                  onChange={(e) => setAddVarQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            {supplierSection}
            {submitError && <p className="text-sm text-red-600">{submitError}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? "Processing…" : "Add variant & stock in"}
            </button>
          </form>
        </div>
      )}

      {/* —— New product —— */}
      {mode === "new" && (
        <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-1">New product and stock in</h3>
          <p className="text-xs text-gray-400 mb-4">Create product, variant, and receive initial stock.</p>
          <form onSubmit={handleNewProductSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product name *</label>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color / size *</label>
                <input
                  value={newProductColor}
                  onChange={(e) => setNewProductColor(e.target.value)}
                  placeholder="e.g. Black"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={newProductQty}
                  onChange={(e) => setNewProductQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            {supplierSection}
            {submitError && <p className="text-sm text-red-600">{submitError}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
              {submitting ? "Processing…" : "Create product, variant & stock in"}
            </button>
          </form>
        </div>
      )}

      {mode === "existing" && submitError && <p className="text-sm text-red-600">{submitError}</p>}
      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  );
}
