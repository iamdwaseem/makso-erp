import { useState } from "react";
import { QRVariantLabel } from "../components/labels/QRVariantLabel";
import api from "../api";
import { useWarehouseStore } from "../store/warehouseStore";
import { useScanner } from "../hooks/useScanner";
import { SearchCombobox } from "../components/SearchCombobox";// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────

interface CartItem {
  id: string; // uuid for React key
  variantId: string;
  /** Empty until the user enters a quantity (no default 0/1). */
  quantity: string;
}

const makeItem = (): CartItem => ({ id: crypto.randomUUID(), variantId: "", quantity: "" });

export function StockEntry() {
  const [mode, setMode] = useState<"existing" | "new" | "variant">("existing");

  // ── Cart (multi-item) ────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([makeItem()]);

  const setCartItem = (id: string, patch: Partial<CartItem>) =>
    setCart(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const addCartRow = () => setCart(prev => [...prev, makeItem()]);
  const removeCartRow = (id: string) =>
    setCart(prev => prev.length === 1 ? prev : prev.filter(r => r.id !== id));

  // ── Supplier ─────────────────────────────────────────────────────────────
  const [supplierMode, setSupplierMode] = useState<"existing" | "new">("existing");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierCode, setNewSupplierCode] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");

  // ── New product (single flow) ────────────────────────────────────────────
  const [productName, setProductName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [newQty, setNewQty] = useState("");
  const [manualVariantSkuEnabled, setManualVariantSkuEnabled] = useState(false);
  const [manualVariantSku, setManualVariantSku] = useState("");

  // ── Add variant flow ─────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState("");
  const [addVarColor, setAddVarColor] = useState("");
  const [addVarSize, setAddVarSize] = useState("");
  const [addVarQty, setAddVarQty] = useState("");
  const [manualAddVariantSkuEnabled, setManualAddVariantSkuEnabled] = useState(false);
  const [manualAddVariantSku, setManualAddVariantSku] = useState("");

  const [qrLabel, setQrLabel] = useState<{ variantId: string, sku: string, productName: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentWarehouseId = useWarehouseStore(state => state.currentWarehouseId);

  useScanner((code) => {
    if (mode !== "existing") return;

    let apiPath = `/variants/sku/${code}`;

    if (code.startsWith("VAR:")) {
      const variantId = code.replace("VAR:", "");
      apiPath = `/variants/${variantId}`;
    }

    api.get(apiPath).then(res => {
      const variant = res.data;
      setCart(prev => {
        if (prev.length === 1 && !prev[0].variantId) {
          return [{ ...prev[0], variantId: variant.id, quantity: "1" }];
        }

        const existingRow = prev.find(r => r.variantId === variant.id);
        if (existingRow) {
          return prev.map(r => {
            if (r.id !== existingRow.id) return r;
            const n = parseInt(String(r.quantity).trim(), 10);
            const next = (Number.isFinite(n) ? n : 0) + 1;
            return { ...r, quantity: String(next) };
          });
        }

        return [...prev, { id: crypto.randomUUID(), variantId: variant.id, quantity: "1" }];
      });
    }).catch(err => {
      console.error(`Scan lookup failed: ${err.message}`);
    });
  });

  const getOrCreateSupplier = async (): Promise<string | null> => {
    if (supplierMode === "existing") {
      if (!selectedSupplierId) { alert("Please select a supplier"); return null; }
      return selectedSupplierId;
    }
    if (!newSupplierName.trim()) { alert("Supplier name is required"); return null; }
    const res = await api.post("/suppliers", {
      name: newSupplierName.trim(),
      ...(newSupplierCode.trim() ? { code: newSupplierCode.trim() } : {}),
      ...(newSupplierPhone.trim() ? { phone: newSupplierPhone.trim() } : {}),
      ...(newSupplierAddress ? { address: newSupplierAddress } : {}),
    });
    return res.data.id;
  };

  const resetSupplier = () => {
    setSelectedSupplierId(""); setNewSupplierName(""); setNewSupplierCode(""); setNewSupplierPhone(""); setNewSupplierAddress("");
  };

  // ── Submit: existing stock-in (multi-item) ───────────────────────────────
  const handleExistingStockIn = async () => {
    if (currentWarehouseId === "all") { alert("Please select a specific warehouse in the header to receive stock."); return; }
    const parsed = cart.map((r) => ({
      ...r,
      qtyNum: parseInt(String(r.quantity).trim(), 10),
    }));
    const validItems = parsed.filter((r) => r.variantId && Number.isFinite(r.qtyNum) && r.qtyNum > 0);
    if (validItems.length === 0) { alert("Add at least one line with a variant and a quantity greater than zero."); return; }
    if (parsed.some((r) => r.variantId && (!Number.isFinite(r.qtyNum) || r.qtyNum <= 0))) {
      alert("Every line with a variant needs a quantity greater than zero.");
      return;
    }
    setSubmitting(true);
    try {
      const supplierId = await getOrCreateSupplier();
      if (!supplierId) { setSubmitting(false); return; }
      await api.post("/purchases", {
        supplierId: supplierId,
        warehouseId: currentWarehouseId,
        items: validItems.map((r) => ({ variantId: r.variantId, quantity: r.qtyNum })),
      });
      setCart([makeItem()]);
      resetSupplier();
      alert(`✓ ${validItems.length} product(s) stocked in successfully!`);
    } catch (err: any) { alert(err.response?.data?.error || err.message); }
    setSubmitting(false);
  };

  // ── Submit: new product ──────────────────────────────────────────────────
  const handleNewProductStockIn = async () => {
    if (currentWarehouseId === "all") { alert("Please select a specific warehouse in the header to receive stock."); return; }
    if (!productName.trim() || !color.trim()) { alert("Product name and color are required"); return; }
    const q = parseInt(String(newQty).trim(), 10);
    if (!Number.isFinite(q) || q <= 0) { alert("Enter a quantity greater than zero"); return; }
    setSubmitting(true);
    try {
      const supplierId = await getOrCreateSupplier();
      if (!supplierId) { setSubmitting(false); return; }
      if (!productCode.trim()) { alert("Product code is required"); setSubmitting(false); return; }
      const productRes = await api.post("/products", { name: productName.trim(), sku: productCode.trim() });
      const variantRes = await api.post("/variants", {
        productId: productRes.data.id,
        color: color.trim(),
        ...(size.trim() ? { size: size.trim() } : {}),
        ...(manualVariantSkuEnabled && manualVariantSku.trim() ? { sku: manualVariantSku.trim() } : {}),
      });
      await api.post("/purchases", { supplierId: supplierId, warehouseId: currentWarehouseId, items: [{ variantId: variantRes.data.id, quantity: q }] });
      setQrLabel({ variantId: variantRes.data.id, sku: variantRes.data.sku, productName: productRes.data.name });
      setProductName(""); setProductCode(""); setColor(""); setSize(""); setNewQty("");
      setManualVariantSkuEnabled(false); setManualVariantSku("");
      resetSupplier();
    } catch (err: any) { alert(err.response?.data?.error || err.message); }
    setSubmitting(false);
  };

  // ── Submit: add variant ──────────────────────────────────────────────────
  const handleAddVariantStockIn = async () => {
    if (currentWarehouseId === "all") { alert("Please select a specific warehouse in the header to receive stock."); return; }
    if (!selectedProduct || !addVarColor.trim()) { alert("Product and color are required"); return; }
    const q = parseInt(String(addVarQty).trim(), 10);
    if (!Number.isFinite(q) || q <= 0) { alert("Enter a quantity greater than zero"); return; }
    setSubmitting(true);
    try {
      const supplierId = await getOrCreateSupplier();
      if (!supplierId) { setSubmitting(false); return; }
      const variantRes = await api.post("/variants", {
        productId: selectedProduct,
        color: addVarColor.trim(),
        ...(addVarSize.trim() ? { size: addVarSize.trim() } : {}),
        ...(manualAddVariantSkuEnabled && manualAddVariantSku.trim() ? { sku: manualAddVariantSku.trim() } : {}),
      });
      await api.post("/purchases", { supplierId: supplierId, warehouseId: currentWarehouseId, items: [{ variantId: variantRes.data.id, quantity: q }] });
      const productRes = await api.get(`/products/${selectedProduct}`);
      const pName = productRes.data.name || "Product";
      setQrLabel({ variantId: variantRes.data.id, sku: variantRes.data.sku, productName: pName });
      setSelectedProduct(""); setAddVarColor(""); setAddVarSize(""); setAddVarQty("");
      setManualAddVariantSkuEnabled(false); setManualAddVariantSku("");
      resetSupplier();
    } catch (err: any) { alert(err.response?.data?.error || err.message); }
    setSubmitting(false);
  };

  const printQr = () => {
    const svg = document.getElementById("qr-print-area");
    if (!svg) return;
    const title = qrLabel?.sku || "QR";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>QR - ${title}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;}p{font-size:18px;margin-top:12px;}</style></head>
      <body>${svg.innerHTML}<script>window.print();window.close();</script></body></html>`);
  };

  // Cart total items
  const cartCount = cart.filter((r) => r.variantId).length;

  const supplierSection = (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">From Supplier</label>
        <button type="button" onClick={() => setSupplierMode(supplierMode === "existing" ? "new" : "existing")}
          className="text-xs text-blue-600 hover:underline font-medium">
          {supplierMode === "existing" ? "+ New supplier" : "Pick existing"}
        </button>
      </div>
      {supplierMode === "existing" ? (
        <SearchCombobox endpoint="/suppliers" mapItem={(s: any) => ({ id: s.id, label: `${s.name} (${s.code})` })} value={selectedSupplierId} onChange={setSelectedSupplierId}
          placeholder="Search supplier..." accentClass="focus:border-blue-500" />
      ) : (
        <div className="space-y-2">
          <input value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="Supplier Name *"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
          {mode !== "new" && (
            <input value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} placeholder="GSM Number (optional)"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
          )}
          <input value={newSupplierCode} onChange={e => setNewSupplierCode(e.target.value)} placeholder="Supplier Code (optional)"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
          <input value={newSupplierAddress} onChange={e => setNewSupplierAddress(e.target.value)} placeholder="Address (optional)"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* QR Modal */}
      {qrLabel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setQrLabel(null)}>
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800">QR Code Ready</h3>
            <p className="text-sm text-gray-500">Print this and stick it on the product</p>
            <div id="qr-print-area" className="flex justify-center">
              <QRVariantLabel variantId={qrLabel.variantId} sku={qrLabel.sku} productName={qrLabel.productName} />
            </div>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={printQr} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">🖨️ Print</button>
              <button onClick={() => setQrLabel(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex gap-2">
        {(["existing", "variant", "new"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m
                ? m === "existing" ? "bg-blue-600 text-white"
                  : m === "variant" ? "bg-indigo-600 text-white"
                  : "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}>
            {m === "existing" ? "Existing Products" : m === "variant" ? "+ Add Variant" : "+ New Product"}
          </button>
        ))}
      </div>

      {/* ── Existing Stock-in (multi-item cart) ────────────────────────────── */}
      {mode === "existing" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Receive Stock</h3>
              <p className="text-xs text-gray-400 mt-0.5">Add multiple products from one supplier in a single purchase</p>
            </div>
            {cartCount > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full">
                {cartCount} item{cartCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Line items */}
          <div className="space-y-3">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_100px_36px] gap-2 px-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product Variant</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Qty</span>
              <span />
            </div>

            {cart.map((row, idx) => (
              <div key={row.id} className="grid grid-cols-[1fr_100px_36px] gap-2 items-center">
                <SearchCombobox
                  endpoint="/variants"
                  mapItem={(v: any) => ({
                    id: v.id,
                    label: `${v.product?.name} — ${v.color}${v.size ? ` / ${v.size}` : ""} (${v.sku})`,
                  })}
                  value={row.variantId}
                  onChange={id => setCartItem(row.id, { variantId: id })}
                  placeholder={`Item ${idx + 1}...`}
                  accentClass="focus:border-blue-500"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(e) => setCartItem(row.id, { quantity: e.target.value })}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm text-center focus:border-blue-500 outline-none w-full"
                />
                <button
                  onClick={() => removeCartRow(row.id)}
                  disabled={cart.length === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Remove row"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            <button onClick={addCartRow}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 px-1 py-1 rounded hover:bg-blue-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add another item
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4 max-w-lg">
            {/* Supplier at the top for this flow */}
            {supplierSection}
            <button onClick={handleExistingStockIn} disabled={submitting || cartCount === 0}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 text-sm font-bold disabled:opacity-50 transition-colors">
              {submitting ? "Recording..." : `Stock In ${cartCount > 0 ? cartCount + " item(s)" : "—"}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Add Variant ──────────────────────────────────────────────────────── */}
      {mode === "variant" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Add Variant to Existing Product</h3>
          <p className="text-xs text-gray-400 mb-4">Add a new color/size to an existing product, generates QR and stocks in</p>
          <div className="space-y-4 max-w-lg">
            {/* Supplier at the top for this flow */}
            {supplierSection}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <SearchCombobox endpoint="/products" mapItem={(p: any) => ({ id: p.id, label: `${p.name} (${p.sku})` })} value={selectedProduct} onChange={setSelectedProduct}
                placeholder="Search product..." accentClass="focus:border-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Color *</label>
                <input value={addVarColor} onChange={(e) => setAddVarColor(e.target.value)} placeholder="e.g. Red"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
                <input value={addVarSize} onChange={(e) => setAddVarSize(e.target.value)} placeholder="e.g. M (optional)"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <p className="text-xs text-indigo-600">SKU is auto-generated from product, color, and size.</p>
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-indigo-900">SKU entry</div>
                <button
                  type="button"
                  onClick={() => {
                    setManualAddVariantSkuEnabled((v) => !v);
                    if (manualAddVariantSkuEnabled) setManualAddVariantSku("");
                  }}
                  className="text-xs font-semibold text-indigo-700 hover:underline"
                >
                  {manualAddVariantSkuEnabled ? "Use auto SKU" : "Enter SKU manually"}
                </button>
              </div>
              {manualAddVariantSkuEnabled && (
                <input
                  value={manualAddVariantSku}
                  onChange={(e) => setManualAddVariantSku(e.target.value)}
                  placeholder="Manual SKU (A–Z, 0–9, -)"
                  className="mt-2 w-full rounded-lg border border-indigo-200 bg-white p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input type="number" min={1} placeholder="Enter quantity" value={addVarQty} onChange={(e) => setAddVarQty(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <button onClick={handleAddVariantStockIn} disabled={submitting}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 text-sm font-bold disabled:opacity-50">
              {submitting ? "Processing..." : "Add Variant, Generate QR & Stock In"}
            </button>
          </div>
        </div>
      )}

      {/* ── New Product ──────────────────────────────────────────────────────── */}
      {mode === "new" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Register New Product & Stock In</h3>
          <p className="text-xs text-gray-400 mb-4">Creates product, variant, QR code, and adds initial stock</p>
          <div className="space-y-4 max-w-lg">
            <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Product Name *"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="Product Code *"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm font-mono focus:ring-2 focus:ring-green-500 outline-none"
              />
              <input
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
                placeholder="GSM (optional)"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Color *</label>
                <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Black"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
                <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. L (optional)"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
            </div>
            <div className="rounded-lg border border-green-100 bg-green-50/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-green-900">Variant SKU</div>
                <button
                  type="button"
                  onClick={() => {
                    setManualVariantSkuEnabled((v) => !v);
                    if (manualVariantSkuEnabled) setManualVariantSku("");
                  }}
                  className="text-xs font-semibold text-green-700 hover:underline"
                >
                  {manualVariantSkuEnabled ? "Use auto SKU" : "Enter SKU manually"}
                </button>
              </div>
              <p className="mt-1 text-xs text-green-700">
                Auto pattern: <span className="font-mono">NAME4-COL3{productCode || "CODE"}-SIZE</span>
              </p>
              {manualVariantSkuEnabled && (
                <input
                  value={manualVariantSku}
                  onChange={(e) => setManualVariantSku(e.target.value)}
                  placeholder="Manual SKU (A–Z, 0–9, -)"
                  className="mt-2 w-full rounded-lg border border-green-200 bg-white p-2.5 text-sm font-mono focus:ring-2 focus:ring-green-500 outline-none"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input type="number" min={1} placeholder="Enter quantity" value={newQty} onChange={(e) => setNewQty(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            {supplierSection}
            <button onClick={handleNewProductStockIn} disabled={submitting}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 text-sm font-bold disabled:opacity-50">
              {submitting ? "Processing..." : "Register Product, Generate QR & Stock In"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
