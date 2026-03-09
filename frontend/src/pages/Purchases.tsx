import { useEffect, useState } from "react";
import api from "../api";

export function Purchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Stock-in form state
  const [showForm, setShowForm] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [supplierMode, setSupplierMode] = useState<"existing" | "new">("existing");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = () => {
    api.get("/purchases").then(r => setPurchases(r.data)).catch(console.error);
    api.get("/variants").then(r => setVariants(r.data)).catch(console.error);
    api.get("/suppliers").then(r => setSuppliers(r.data)).catch(console.error);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setSelectedVariant(""); setQuantity(1);
    setSupplierMode("existing"); setSelectedSupplierId("");
    setNewSupplierName(""); setNewSupplierPhone("");
  };

  const handleStockIn = async () => {
    if (!selectedVariant || quantity < 1) { alert("Select a variant and quantity"); return; }
    setSubmitting(true);

    try {
      let supplierId = selectedSupplierId;

      // Create new supplier inline if needed
      if (supplierMode === "new") {
        if (!newSupplierName || !newSupplierPhone) { alert("Supplier name and phone required"); setSubmitting(false); return; }
        const res = await api.post("/suppliers", { name: newSupplierName, phone: newSupplierPhone });
        supplierId = res.data.id;
        setSuppliers(prev => [...prev, res.data]);
      }

      if (!supplierId) { alert("Please select or add a supplier"); setSubmitting(false); return; }

      await api.post("/purchases", {
        supplier_id: supplierId,
        items: [{ variant_id: selectedVariant, quantity }],
      });

      resetForm(); setShowForm(false); fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500"><span className="font-semibold text-gray-900">{purchases.length}</span> stock-in records</p>
        <button onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {showForm ? "Cancel" : "📥 Stock In"}
        </button>
      </div>

      {/* Stock In Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Receive Goods</h3>
          <div className="space-y-4 max-w-lg">
            {/* What */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Variant</label>
              <select value={selectedVariant} onChange={e => setSelectedVariant(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:border-blue-500 outline-none">
                <option value="">Select what arrived...</option>
                {variants.map(v => <option key={v.id} value={v.id}>{v.product?.name} — {v.color} ({v.sku})</option>)}
              </select>
            </div>

            {/* How many */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Received</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
            </div>

            {/* From whom */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">From Supplier</label>
                <button onClick={() => setSupplierMode(supplierMode === "existing" ? "new" : "existing")}
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

            <button onClick={handleStockIn} disabled={submitting}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 text-sm font-bold disabled:opacity-50">
              {submitting ? "Recording..." : `Stock In ${quantity} unit(s)`}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-800">Stock-In History</h3>
        {purchases.map(p => {
          const totalUnits = p.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
          return (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-600 text-lg">📥</span>
                      <p className="text-sm font-semibold text-gray-900">From <span className="text-blue-700">{p.supplier?.name || "Unknown"}</span></p>
                    </div>
                    <p className="text-xs text-gray-400 ml-7">{new Date(p.purchase_date || p.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    {p.invoice_number && <p className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono">{p.invoice_number}</p>}
                    <p className="text-xs text-gray-500 mt-1"><span className="font-bold text-green-700">+{totalUnits} units</span></p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50/50">
                {p.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span className="text-gray-700">{item.variant?.product?.name} · {item.variant?.color} <span className="text-gray-400 font-mono text-xs">({item.variant?.sku})</span></span>
                    <span className="font-bold text-green-700">+{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
