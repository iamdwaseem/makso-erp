import { useEffect, useState } from "react";
import api from "../api";

interface InventoryItem {
  id: string;
  variant_id: string; // Added variant_id
  quantity: number;
  updated_at: string;
  variant: { sku: string; color: string; product: { name: string } };
  supplier: { name: string; phone: string } | null;
}

interface LedgerEntry {
  id: string;
  action: "IN" | "OUT";
  quantity: number;
  reference_type: string;
  reference_id: string;
  created_at: string;
}

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<InventoryItem | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    api.get("/inventory")
      .then((res) => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.variant?.product?.name?.toLowerCase().includes(q) ||
      item.variant?.color?.toLowerCase().includes(q) ||
      item.variant?.sku?.toLowerCase().includes(q) ||
      item.supplier?.name?.toLowerCase().includes(q)
    );
  });

  const totalUnits = filtered.reduce((s, i) => s + i.quantity, 0);

  const fetchLedger = (item: InventoryItem) => {
    setSelectedVariant(item);
    setLedgerLoading(true);
    api.get(`/inventory/${item.variant_id}/ledger`)
      .then((res) => setLedger(res.data))
      .catch(console.error)
      .finally(() => setLedgerLoading(false));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product, variant, SKU, or supplier..."
          className="w-full sm:w-80 rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{filtered.length}</span> records ·
          <span className="font-semibold text-gray-900 ml-1">{totalUnits}</span> total units
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Variant</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No inventory records found.</td></tr>
             ) : filtered.map((item) => (
              <tr 
                key={item.id} 
                onClick={() => fetchLedger(item)}
                className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${item.quantity < 10 ? "bg-red-50/50" : ""}`}
              >
                <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.variant?.product?.name}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{item.variant?.color}</td>
                <td className="py-3 px-4 text-sm text-gray-500 font-mono">{item.variant?.sku}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{item.supplier?.name || "—"}</td>
                <td className="py-3 px-4 text-sm font-bold text-right text-gray-900">{item.quantity}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    item.quantity === 0 ? "bg-red-100 text-red-700" :
                    item.quantity < 10 ? "bg-yellow-100 text-yellow-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {item.quantity === 0 ? "Out of Stock" : item.quantity < 10 ? "Low Stock" : "In Stock"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stock Ledger Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-auto max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">📜</span> Stock Ledger
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedVariant.variant.product.name} · {selectedVariant.variant.color} ({selectedVariant.variant.sku})
                </p>
              </div>
              <button onClick={() => setSelectedVariant(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {ledgerLoading ? (
                <div className="py-20 text-center text-gray-400 italic">Fetching history...</div>
              ) : ledger.length === 0 ? (
                <div className="py-20 text-center text-gray-400">No stock movements found for this item.</div>
              ) : (
                <div className="space-y-4">
                  <table className="min-w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left pb-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="text-left pb-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                        <th className="text-left pb-3 text-xs font-medium text-gray-500 uppercase">Reference</th>
                        <th className="text-right pb-3 text-xs font-medium text-gray-500 uppercase">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ledger.map((entry) => (
                        <tr key={entry.id}>
                          <td className="py-4 text-sm text-gray-600">
                            {new Date(entry.created_at).toLocaleString()}
                          </td>
                          <td className="py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              entry.action === "IN" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            }`}>
                              {entry.action}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-gray-500">
                            {entry.reference_type} · <span className="text-[10px] font-mono">{entry.reference_id.slice(0, 8)}</span>
                          </td>
                          <td className={`py-4 text-sm text-right font-bold ${entry.action === "IN" ? "text-green-600" : "text-orange-600"}`}>
                            {entry.action === "IN" ? "+" : "-"}{entry.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedVariant(null)}
                className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
