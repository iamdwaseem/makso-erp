import { useState } from "react";
import { QRVariantLabel } from "../components/labels/QRVariantLabel";
import api from "../api";
import { useWarehouseStore } from "../store/warehouseStore";
import { useScanner } from "../hooks/useScanner";
import { SearchCombobox } from "../components/SearchCombobox";

// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────

interface CartItem {
  id: string; // uuid for React key
  variantId: string;
  quantity: number;
}

const makeItem = (): CartItem => ({ id: crypto.randomUUID(), variantId: "", quantity: 1 });

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
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");

  // ── New product (single flow) ────────────────────────────────────────────
  const [productName, setProductName] = useState("");
  const [color, setColor] = useState("");
  const [newQty, setNewQty] = useState(1);

  // ── Add variant flow ─────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState("");
  const [addVarColor, setAddVarColor] = useState("");
  const [addVarQty, setAddVarQty] = useState(1);

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
          return [{ ...prev[0], variantId: variant.id, quantity: 1 }];
        }
        
        const existingRow = prev.find(r => r.variantId === variant.id);
        if (existingRow) {
          return prev.map(r => r.id === existingRow.id ? { ...r, quantity: r.quantity + 1 } : r);
        }
        
        return [...prev, { id: crypto.randomUUID(), variantId: variant.id, quantity: 1 }];
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
    if (!newSupplierName || !newSupplierPhone) { alert("Supplier name and phone required"); return null; }
    const res = await api.post("/suppliers", {
      name: newSupplierName, phone: newSupplierPhone,
      ...(newSupplierAddress ? { address: newSupplierAddress } : {}),
    });
    return res.data.id;
  };

  const resetSupplier = () => {
    setSelectedSupplierId(""); setNewSupplierName(""); setNewSupplierPhone(""); setNewSupplierAddress("");
  };

  // ── Submit: existing stock-in (multi-item) ───────────────────────────────
  const handleExistingStockIn = async () => {
    if (currentWarehouseId === "all") { alert("Please select a specific warehouse in the header to receive stock."); return; }
    const validItems = cart.filter(r => r.variantId && r.quantity >= 1);
    if (validItems.length === 0) { alert("Add at least one product variant"); return; }
    if (cart.some(r => r.variantId && r.quantity < 1)) { alert("All quantities must be ≥ 1"); return; }
    setSubmitting(true);
    try {
      const supplierId = await getOrCreateSupplier();
      if (!supplierId) { setSubmitting(false); return; }
      await api.post("/purchases", {
        supplierId: supplierId,
        warehouseId: currentWarehouseId,
        items: validItems.map(r => ({ variantId: r.variantId, quantity: r.quantity })),
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
    if (!productName || !color) { alert("Fill in all product fields"); return; }
    setSubmitting(true);
    try {
      const supplierId = await getOrCreateSupplier();
      if (!supplierId) { setSubmitting(false); return; }
      const productRes = await api.post("/products", { name: productName });
      const variantRes = await api.post("/variants", { productId: productRes.data.id, color });
      await api.post("/purchases", { supplierId: supplierId, warehouseId: currentWarehouseId, items: [{ variantId: variantRes.data.id, quantity: newQty }] });
      setQrLabel({ variantId: variantRes.data.id, sku: variantRes.data.sku, productName: productRes.data.name });
      setProductName(""); setColor(""); setNewQty(1);
      resetSupplier();
    } catch (err: any) { alert(err.response?.data?.error || err.message); }
    setSubmitting(false);
  };

  // ── Submit: add variant ──────────────────────────────────────────────────
  const handleAddVariantStockIn = async () => {
    if (currentWarehouseId === "all") { alert("Please select a specific warehouse in the header to receive stock."); return; }
    if (!selectedProduct || !addVarColor) { alert("Fill in all variant fields"); return; }
    setSubmitting(true);
    try {
      const supplierId = await getOrCreateSupplier();
      if (!supplierId) { setSubmitting(false); return; }
      const variantRes = await api.post("/variants", { productId: selectedProduct, color: addVarColor });
      await api.post("/purchases", { supplierId: supplierId, warehouseId: currentWarehouseId, items: [{ variantId: variantRes.data.id, quantity: addVarQty }] });
      const productRes = await api.get(`/products/${selectedProduct}`);
      const pName = productRes.data.name || "Product";
      setQrLabel({ variantId: variantRes.data.id, sku: variantRes.data.sku, productName: pName });
      setSelectedProduct(""); setAddVarColor(""); setAddVarQty(1);
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
  const cartCount = cart.filter(r => r.variantId).length;

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
        <SearchCombobox endpoint="/suppliers" mapItem={(s: any) => ({ id: s.id, label: `${s.name} (${s.phone})` })} value={selectedSupplierId} onChange={setSelectedSupplierId}
          placeholder="Search supplier..." accentClass="focus:border-blue-500" />
      ) : (
        <div className="space-y-2">
          <input value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="Supplier Name *"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
          <input value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} placeholder="Phone *"
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
                  mapItem={(v: any) => ({ id: v.id, label: `${v.product?.name} — ${v.color} (${v.sku})` })}
                  value={row.variantId}
                  onChange={id => setCartItem(row.id, { variantId: id })}
                  placeholder={`Item ${idx + 1}...`}
                  accentClass="focus:border-blue-500"
                />
                <input
                  type="number" min="1" value={row.quantity}
                  onChange={e => setCartItem(row.id, { quantity: parseInt(e.target.value) || 1 })}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <SearchCombobox endpoint="/products" mapItem={(p: any) => ({ id: p.id, label: `${p.name} (${p.sku})` })} value={selectedProduct} onChange={setSelectedProduct}
                placeholder="Search product..." accentClass="focus:border-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={addVarColor} onChange={e => setAddVarColor(e.target.value)} placeholder="Color/Size * (e.g. Red)"
                className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50 p-2.5 text-xs text-indigo-400 flex items-center">
                SKU auto-generated from product + colour
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
              <input type="number" min="1" value={addVarQty} onChange={e => setAddVarQty(parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            {supplierSection}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-dashed border-green-200 bg-green-50 p-2.5 text-xs text-green-500 flex items-center">
                Base SKU auto-generated from name
              </div>
              <input value={color} onChange={e => setColor(e.target.value)} placeholder="Color/Size * (e.g. Black)"
                className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div className="rounded-lg border border-dashed border-green-200 bg-green-50 p-2.5 text-xs text-green-500 flex items-center">
              Variant SKU auto-generated: {productName ? `[initials]-NNN-[colour-initials]` : "enter product name first"}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
              <input type="number" min="1" value={newQty} onChange={e => setNewQty(parseInt(e.target.value) || 1)}
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
