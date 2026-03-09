import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { QRCodeSVG } from "qrcode.react";
import api from "../api";

export function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [qrSku, setQrSku] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm();
  const { register: rv, handleSubmit: hsv, reset: resetV } = useForm();

  const fetchAll = () => {
    api.get("/products").then(r => setProducts(r.data)).catch(console.error);
    api.get("/variants").then(r => setVariants(r.data)).catch(console.error);
  };

  useEffect(() => { fetchAll(); }, []);

  // Combined flow: create product + first variant + show QR
  const onNewProduct = async (data: any) => {
    try {
      // 1. Create the product
      const productRes = await api.post("/products", {
        name: data.name,
        sku: data.base_sku,
        description: data.description || undefined,
      });

      // 2. Create the first variant with the variant SKU
      const variantRes = await api.post("/variants", {
        product_id: productRes.data.id,
        color: data.color,
        sku: data.variant_sku,
      });

      reset();
      fetchAll();

      // 3. Show QR immediately
      setQrSku(variantRes.data.sku);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  // Add more variants to existing products
  const onAddVariant = async (data: any) => {
    try {
      const res = await api.post("/variants", data);
      resetV();
      fetchAll();
      setQrSku(res.data.sku);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const printQr = () => {
    const svg = document.getElementById("qr-print-area");
    if (!svg) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>QR - ${qrSku}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:monospace;}
      p{font-size:18px;margin-top:12px;}</style></head>
      <body>${svg.outerHTML}<p>${qrSku}</p>
      <script>window.print();window.close();</script></body></html>
    `);
  };

  return (
    <div className="space-y-6">
      {/* QR Modal */}
      {qrSku && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setQrSku(null)}>
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center space-y-4" onClick={(e) => e.stopPropagation()}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Product + First Variant (combined) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold mb-1 text-gray-800">📦 Register New Product</h3>
          <p className="text-xs text-gray-400 mb-4">Creates the product, its first variant, and generates a QR code</p>
          <form onSubmit={handleSubmit(onNewProduct)} className="space-y-3">
            <input {...register("name", { required: true })} placeholder="Product Name *" className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <input {...register("base_sku", { required: true })} placeholder="Base SKU * (e.g. MK-001)" className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              <input {...register("color", { required: true })} placeholder="Color/Size * (e.g. Black)" className="rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <input {...register("variant_sku", { required: true })} placeholder="Variant SKU * (e.g. MK-001-BLK) — this goes on QR" className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <textarea {...register("description")} placeholder="Description (optional)" rows={2} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">Create Product & Generate QR</button>
          </form>
        </div>

        {/* Add Variant to existing product */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold mb-1 text-gray-800">🏷️ Add Variant to Existing Product</h3>
          <p className="text-xs text-gray-400 mb-4">For adding another color/size to an existing product</p>
          <form onSubmit={hsv(onAddVariant)} className="space-y-3">
            <select {...rv("product_id", { required: true })} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
              <option value="">Select Product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
            <input {...rv("color", { required: true })} placeholder="Color/Size *" className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
            <input {...rv("sku", { required: true })} placeholder="Variant SKU (unique) *" className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
            <button type="submit" className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">Add Variant & Generate QR</button>
          </form>
        </div>
      </div>

      {/* All Variants with QR */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold mb-4 text-gray-800">All Registered Variants</h3>
        {variants.length === 0 ? (
          <p className="text-gray-400 text-sm">No variants yet. Create a product above.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {variants.map((v) => (
              <div key={v.id} className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                <QRCodeSVG value={v.sku} size={64} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{v.product?.name || "Product"}</p>
                  <p className="text-xs text-gray-500">{v.color}</p>
                  <p className="text-xs font-mono text-gray-400 mt-1">{v.sku}</p>
                </div>
                <button onClick={() => setQrSku(v.sku)} className="text-blue-600 text-xs hover:underline shrink-0">🖨️ Print</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
