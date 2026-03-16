"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useScanner } from "@/hooks/useScanner";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";

interface CartItem {
  variantId: string;
  sku: string;
  label: string;
  quantity: number;
}

export default function StockExitPage() {
  const { warehouseId: contextWarehouseId } = useGlobalFilter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [manualSku, setManualSku] = useState("");
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" | "" }>({ message: "", type: "" });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [customers, setCustomers] = useState<{ id: string; name: string; phone?: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [completedGdn, setCompletedGdn] = useState<any>(null);
  const lastScanRef = useRef<string | null>(null);

  const effectiveWarehouseId = contextWarehouseId && contextWarehouseId !== "all" ? contextWarehouseId : "";

  useEffect(() => {
    api
      .getCustomers({ page: 1, limit: 500 })
      .then((res: any) => setCustomers(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setCustomers([]));
  }, []);

  const addToCart = useCallback((variant: { id: string; sku: string; product?: { name: string }; color?: string }, qty = 1) => {
    const label = `${variant.product?.name ?? "Product"} — ${variant.color ?? ""}`.trim();
    setCart((prev) => {
      const existing = prev.find((c) => c.variantId === variant.id);
      if (existing) {
        return prev.map((c) => (c.variantId === variant.id ? { ...c, quantity: c.quantity + qty } : c));
      }
      return [...prev, { variantId: variant.id, sku: variant.sku, label, quantity: qty }];
    });
  }, []);

  const updateCartQty = (variantId: string, qty: number) => {
    if (qty < 1) return;
    setCart((prev) => prev.map((c) => (c.variantId === variantId ? { ...c, quantity: qty } : c)));
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((c) => c.variantId !== variantId));
  };

  const clearCart = () => setCart([]);

  const processScannedCode = useCallback(
    (decodedText: string) => {
      if (lastScanRef.current === decodedText) return;
      lastScanRef.current = decodedText;
      let promise: Promise<any>;
      if (decodedText.startsWith("VAR:")) {
        const variantId = decodedText.replace("VAR:", "").trim();
        promise = api.getVariantById(variantId);
      } else {
        promise = api.getVariantBySku(decodedText);
      }
      setStatus({ message: "Looking up item…", type: "" });
      promise
        .then((v: any) => {
          addToCart(v, 1);
          setStatus({ message: `+ Added: ${v.product?.name ?? ""} — ${v.color ?? ""}`, type: "success" });
          setTimeout(() => {
            lastScanRef.current = null;
            setStatus({ message: "", type: "" });
          }, 2000);
        })
        .catch(() => {
          setStatus({ message: `Item not found: ${decodedText}`, type: "error" });
          setTimeout(() => {
            lastScanRef.current = null;
            setStatus({ message: "", type: "" });
          }, 2000);
        });
    },
    [addToCart]
  );

  useScanner(processScannedCode);

  const handleManualLookup = () => {
    const sku = manualSku.trim();
    if (!sku) return;
    setStatus({ message: "Looking up SKU…", type: "" });
    api
      .getVariantBySku(sku)
      .then((v: any) => {
        addToCart(v, 1);
        setManualSku("");
        setStatus({ message: `+ Added: ${v.product?.name ?? ""} — ${v.color ?? ""}`, type: "success" });
        setTimeout(() => setStatus({ message: "", type: "" }), 2000);
      })
      .catch(() => {
        setStatus({ message: `SKU "${sku}" not found`, type: "error" });
      });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!effectiveWarehouseId) {
      setStatus({ message: "Select a specific warehouse in the header to record stock exit.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      let customerId = selectedCustomerId;
      if (customerMode === "new") {
        if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
          setStatus({ message: "Customer name and phone are required", type: "error" });
          setSubmitting(false);
          return;
        }
        const res = await api.createCustomer({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim(),
          address: newCustomerAddress.trim() || undefined,
        });
        customerId = (res as { id: string }).id;
      }
      if (!customerId) {
        setStatus({ message: "Select or add a customer", type: "error" });
        setSubmitting(false);
        return;
      }
      const payload = {
        warehouseId: effectiveWarehouseId,
        customerId,
        items: cart.map((c) => ({ variantId: c.variantId, quantity: c.quantity })),
      };
      const gdn = await api.createGdn(payload);
      if (gdn?.id) await api.submitGdn(gdn.id);
      setCompletedGdn(gdn);
      clearCart();
      setCheckoutOpen(false);
      setSelectedCustomerId("");
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerAddress("");
      setStatus({ message: `Stock exit recorded — ${cart.length} product(s) delivered`, type: "success" });
      setTimeout(() => setStatus({ message: "", type: "" }), 3000);
    } catch (err: any) {
      setStatus({ message: err?.message ?? "Checkout failed", type: "error" });
    }
    setSubmitting(false);
  };

  const totalUnits = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Stock Exit</h1>
          <p className="text-sm text-gray-500 mt-0.5">Scan or enter SKU to add items; choose customer and confirm to record delivery (GDN).</p>
        </div>
        <Link href="/inventory/delivery-notes" className="text-sm font-medium text-blue-600 hover:underline">
          View all delivery notes →
        </Link>
      </div>

      {!effectiveWarehouseId && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Select a specific warehouse in the header to record stock exit.
        </div>
      )}

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-orange-100 bg-orange-50 p-5">
              <p className="text-sm font-medium text-orange-600">Confirm stock exit</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {cart.length} product{cart.length !== 1 ? "s" : ""} · {totalUnits} unit{totalUnits !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto px-5 py-4">
              {cart.map((item) => (
                <div key={item.variantId} className="flex justify-between text-sm text-gray-700">
                  <span className="truncate">{item.label}</span>
                  <span className="ml-2 shrink-0 font-semibold">×{item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4 border-t border-gray-100 px-5 pb-5 pt-3">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Deliver to</label>
                  <button
                    type="button"
                    onClick={() => setCustomerMode(customerMode === "existing" ? "new" : "existing")}
                    className="text-xs font-medium text-orange-600 hover:underline"
                  >
                    {customerMode === "existing" ? "+ New customer" : "Pick existing"}
                  </button>
                </div>
                {customerMode === "existing" ? (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-orange-500"
                  >
                    <option value="">Select customer…</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Customer name *"
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-orange-500"
                    />
                    <input
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Phone *"
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-orange-500"
                    />
                    <input
                      value={newCustomerAddress}
                      onChange={(e) => setNewCustomerAddress(e.target.value)}
                      placeholder="Address (optional)"
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                disabled={submitting}
                className="flex-1 rounded-xl bg-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={submitting}
                className="flex-1 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {submitting ? "Processing…" : "Confirm exit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed GDN modal */}
      {completedGdn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setCompletedGdn(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900">Delivery note recorded</h2>
              <p className="mt-1 text-sm text-gray-500">
                GDN #{completedGdn.gdnNumber ?? completedGdn.id?.slice(0, 8)} — stock exit submitted.
              </p>
            </div>
            <div className="flex gap-3 p-5">
              <button
                type="button"
                onClick={() => setCompletedGdn(null)}
                className="flex-1 rounded-xl bg-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                Close
              </button>
              <Link
                href={`/inventory/delivery-notes/${completedGdn.id}`}
                className="flex-1 rounded-xl bg-orange-600 py-3 text-center text-sm font-bold text-white hover:bg-orange-700"
              >
                View delivery note
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: manual SKU + cart */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs text-gray-500">Enter SKU or scan barcode (hardware scanner):</p>
            <div className="flex gap-2">
              <input
                value={manualSku}
                onChange={(e) => setManualSku(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
                placeholder="e.g. PRD-001-BLK"
                className="flex-1 rounded-lg border border-gray-300 p-2.5 font-mono text-sm outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleManualLookup}
                className="shrink-0 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700"
              >
                Add
              </button>
            </div>
          </div>

          {status.message && (
            <div
              className={`rounded-xl border p-4 text-sm font-medium ${
                status.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : status.type === "error"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-gray-200 bg-gray-50 text-gray-700"
              }`}
            >
              {status.message}
            </div>
          )}

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                Cart
                {cart.length > 0 && (
                  <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    {cart.length} item{cart.length !== 1 ? "s" : ""} · {totalUnits} unit{totalUnits !== 1 ? "s" : ""}
                  </span>
                )}
              </h3>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400">Scan a barcode or enter a SKU to add items.</p>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="font-mono text-xs text-gray-400">{item.sku}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-base font-bold leading-none text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateCartQty(item.variantId, parseInt(e.target.value, 10) || 1)}
                        className="w-12 rounded-md border border-gray-200 py-1 text-center text-sm font-bold outline-none focus:border-orange-400"
                      />
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-base font-bold leading-none text-gray-600 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.variantId)}
                      className="p-1 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(true)}
                  disabled={cart.length === 0 || !effectiveWarehouseId}
                  className="mt-2 w-full rounded-xl bg-orange-600 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
                >
                  Checkout — {cart.length} product{cart.length !== 1 ? "s" : ""}, {totalUnits} unit{totalUnits !== 1 ? "s" : ""}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: info */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800">Stock exit (GDN)</h3>
          <p className="mt-2 text-sm text-gray-500">
            Use this page to quickly record goods going out: scan or enter SKUs, add items to the cart, then choose the customer and confirm. A Goods Delivery Note is created and submitted so inventory is updated immediately.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            For full delivery note list and draft editing, go to{" "}
            <Link href="/inventory/delivery-notes" className="font-medium text-blue-600 hover:underline">
              Goods Delivery Note
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
