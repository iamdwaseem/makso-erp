import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "../api";

export function StockEntry() {
  const [variants, setVariants] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Which mode
  const [mode, setMode] = useState<"existing" | "new" | "variant">("existing");

  // Existing variant stock-in
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [supplierMode, setSupplierMode] = useState<"existing" | "new">("existing");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");

  // New product registration
  const [productName, setProductName] = useState("");
  const [baseSku, setBaseSku] = useState("");
  const [color, setColor] = useState("");
  const [variantSku, setVariantSku] = useState("");
  const [newQty, setNewQty] = useState(1);

  const [qrSku, setQrSku] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add variant to existing product
  const [selectedProduct, setSelectedProduct] = useState("");
  const [addVarColor, setAddVarColor] = useState("");
  const [addVarSku, setAddVarSku] = useState("");
  const [addVarQty, setAddVarQty] = useState(1);
  const [products, setProducts] = useState<any[]>([]);

  const fetchAll = () => {
    api.get("/variants").then(r => setVariants(r.data)).catch(console.error);
    api.get("/suppliers").then(r => setSuppliers(r.data)).catch(console.error);
    api.get("/products").then(r => setProducts(r.data)).catch(console.error);
  };

  useEffect(() => { fetchAll(); }, []);

  const getOrCreateSupplier = async (): Promise<string | null> => {
    if (supplierMode === "existing") {
      if (!selectedSupplierId) { alert("Please select a supplier"); return null; }
      return selectedSupplierId;
    }
    if (!newSupplierName || !newSupplierPhone) { alert("Supplier name and phone required"); return null; }
    const res = await api.post("/suppliers", { name: newSupplierName, phone: newSupplierPhone });
    setSuppliers(prev => [...prev, res.data]);
    return res.data.id;
  };

  const handleExistingStockIn = async () => {
    if (!selectedVariant || quantity < 1) { alert("Select a variant and quantity"); return; }
    setSubmitting(true);
    try {
      const supplierId = await getOrCreateSupplier();
      if (!supplierId) { setSubmitting(false); return; }
      await api.post("/purchases", { supplier_id: supplierId, items: [{ variant_id: selectedVariant, quantity }] });
      setSelectedVariant(""); setQuantity(1); setSelectedSupplierId(""); setNewSupplierName(""); setNewSupplierPhone("");
      fetchAll();
      alert("✓ Stock added successfully!");
    } catch (err: any) { alert(err.response?.data?.error || err.message); }
    setSubmitting(false);
  };

  const handleNewProductStockIn = async () => {
    if (!productName || !baseSku || !color || !variantSku) { alert("Fill in all product fields"); return; }
    if (newQty < 1) { alert("Quantity must be at least 1"); return; }
    setSubmitting(true);
    try {
      const supplierId = await getOrCreateSupplier();
      if (!supplierId) { setSubmitting(false); return; }

      // 1. Create product
      const productRes = await api.post("/products", { name: productName, sku: baseSku });
      // 2. Create variant
      const variantRes = await api.post("/variants", { product_id: productRes.data.id, color, sku: variantSku });
      // 3. Stock in
      await api.post("/purchases", { supplier_id: supplierId, items: [{ variant_id: variantRes.data.id, quantity: newQty }] });

      setQrSku(variantRes.data.sku);
      setProductName(""); setBaseSku(""); setColor(""); setVariantSku(""); setNewQty(1);
      setSelectedSupplierId(""); setNewSupplierName(""); setNewSupplierPhone("");
      fetchAll();
    } catch (err: any) { alert(err.response?.data?.error || err.message); }
    setSubmitting(false);
  };

  const handleAddVariantStockIn = async () => {
    if (!selectedProduct || !addVarColor || !addVarSku) { alert("Fill in all variant fields"); return; }
    if (addVarQty < 1) { alert("Quantity must be at least 1"); return; }
    setSubmitting(true);
    try {
      const supplierId = await getOrCreateSupplier();
      if (!supplierId) { setSubmitting(false); return; }

      const variantRes = await api.post("/variants", { product_id: selectedProduct, color: addVarColor, sku: addVarSku });
      await api.post("/purchases", { supplier_id: supplierId, items: [{ variant_id: variantRes.data.id, quantity: addVarQty }] });

      setQrSku(variantRes.data.sku);
      setSelectedProduct(""); setAddVarColor(""); setAddVarSku(""); setAddVarQty(1);
      setSelectedSupplierId(""); setNewSupplierName(""); setNewSupplierPhone("");
      fetchAll();
    } catch (err: any) { alert(err.response?.data?.error || err.message); }
    setSubmitting(false);
  };

  const printQr = () => {
    const svg = document.getElementById("qr-print-area");
    if (!svg) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>QR - ${qrSku}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:monospace;}p{font-size:18px;margin-top:12px;}</style></head>
      <body>${svg.outerHTML}<p>${qrSku}</p><script>window.print();window.close();</script></body></html>`);
  };

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
        <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:border-blue-500 outline-none">
          <option value="">Select supplier...</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>)}
        </select>
      ) : (
        <div className="space-y-2">
          <input value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="Supplier Name *"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
          <input value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} placeholder="Phone *"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* QR Modal */}
      {qrSku && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setQrSku(null)}>
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800">QR Code Ready</h3>
            <p className="text-sm text-gray-500">Print this and stick it on the product</p>
            <div id="qr-print-area"><QRCodeSVG value={qrSku} size={200} /></div>
            <p className="font-mono text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded">{qrSku}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={printQr} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">🖨️ Print</button>
              <button onClick={() => setQrSku(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setMode("existing")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "existing" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
          Existing Product
        </button>
        <button onClick={() => setMode("variant")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "variant" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
          + Add Variant
        </button>
        <button onClick={() => setMode("new")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "new" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
          + New Product
        </button>
      </div>

      {mode === "existing" ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Receive Existing Stock</h3>
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Variant</label>
              <select value={selectedVariant} onChange={e => setSelectedVariant(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:border-blue-500 outline-none">
                <option value="">Select what arrived...</option>
                {variants.map(v => <option key={v.id} value={v.id}>{v.product?.name} — {v.color} ({v.sku})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
            </div>
            {supplierSection}
            <button onClick={handleExistingStockIn} disabled={submitting}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 text-sm font-bold disabled:opacity-50">
              {submitting ? "Recording..." : `Stock In ${quantity} unit(s)`}
            </button>
          </div>
        </div>
      ) : mode === "variant" ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Add Variant to Existing Product</h3>
          <p className="text-xs text-gray-400 mb-4">Add a new color/size to an existing product, generates QR and stocks in</p>
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:border-indigo-500 outline-none">
                <option value="">Select product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={addVarColor} onChange={e => setAddVarColor(e.target.value)} placeholder="Color/Size * (e.g. Red)"
                className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input value={addVarSku} onChange={e => setAddVarSku(e.target.value)} placeholder="Variant SKU * (e.g. MK-001-RED)"
                className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
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
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Register New Product & Stock In</h3>
          <p className="text-xs text-gray-400 mb-4">Creates product, variant, QR code, and adds initial stock</p>
          <div className="space-y-4 max-w-lg">
            <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Product Name *"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <input value={baseSku} onChange={e => setBaseSku(e.target.value)} placeholder="Base SKU * (e.g. MK-001)"
                className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
              <input value={color} onChange={e => setColor(e.target.value)} placeholder="Color/Size * (e.g. Black)"
                className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <input value={variantSku} onChange={e => setVariantSku(e.target.value)} placeholder="Variant SKU * (e.g. MK-001-BLK) — goes on QR"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
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
