import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../api";

interface ScanEntry {
  sku: string;
  customerName: string;
  quantity: number;
  status: "success" | "error";
  message: string;
  time: string;
}

export function ScanStation() {
  const [scanHistory, setScanHistory] = useState<ScanEntry[]>([]);
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" | "" }>({ message: "", type: "" });

  // Checkout flow state
  const [pendingSku, setPendingSku] = useState<string | null>(null);
  const [pendingVariant, setPendingVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const lastScanRef = useRef<string | null>(null);

  useEffect(() => {
    api.get("/customers").then(r => setCustomers(r.data)).catch(console.error);
    api.get("/variants").then(r => setVariants(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);

    function onScanSuccess(decodedText: string) {
      if (lastScanRef.current === decodedText) return;
      lastScanRef.current = decodedText;

      // Find variant by SKU
      const variant = variants.find(v => v.sku === decodedText);
      if (!variant) {
        setStatus({ message: `✗ SKU "${decodedText}" not found in system`, type: "error" });
        setTimeout(() => { lastScanRef.current = null; }, 2000);
        return;
      }

      setPendingSku(decodedText);
      setPendingVariant(variant);
      setQuantity(1);
      setCustomerMode("existing");
      setSelectedCustomerId("");
      setNewCustomerName("");
      setNewCustomerPhone("");
      setTimeout(() => { lastScanRef.current = null; }, 2000);
    }

    scanner.render(onScanSuccess, () => {});
    return () => { scanner.clear().catch(() => {}); };
  }, [variants]);

  const handleCheckout = async () => {
    if (!pendingVariant || quantity < 1) return;
    setSubmitting(true);

    try {
      let customerId = selectedCustomerId;

      // Create new customer inline if needed
      if (customerMode === "new") {
        if (!newCustomerName || !newCustomerPhone) {
          alert("Customer name and phone are required");
          setSubmitting(false);
          return;
        }
        const customerRes = await api.post("/customers", { name: newCustomerName, phone: newCustomerPhone });
        customerId = customerRes.data.id;
        setCustomers(prev => [...prev, customerRes.data]);
      }

      if (!customerId) {
        alert("Please select or add a customer");
        setSubmitting(false);
        return;
      }

      // Create the sale (which decreases inventory + creates ledger entry)
      await api.post("/sales", {
        customer_id: customerId,
        items: [{ variant_id: pendingVariant.id, quantity }],
      });

      const customerName = customerMode === "new" ? newCustomerName : customers.find(c => c.id === customerId)?.name || "Customer";

      const entry: ScanEntry = {
        sku: pendingSku!, customerName, quantity, status: "success",
        message: `Sold ${quantity} to ${customerName}`, time: new Date().toLocaleTimeString(),
      };
      setScanHistory(prev => [entry, ...prev]);
      setStatus({ message: `✓ ${quantity}x ${pendingSku} sold to ${customerName}`, type: "success" });
      setPendingSku(null);
      setPendingVariant(null);
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message;
      const entry: ScanEntry = {
        sku: pendingSku!, customerName: "", quantity, status: "error",
        message: msg, time: new Date().toLocaleTimeString(),
      };
      setScanHistory(prev => [entry, ...prev]);
      setStatus({ message: `✗ ${msg}`, type: "error" });
    }
    setSubmitting(false);
  };

  // Manual SKU lookup
  const [manualSku, setManualSku] = useState("");

  const handleManualLookup = () => {
    const sku = manualSku.trim();
    if (!sku) return;
    const variant = variants.find(v => v.sku === sku);
    if (!variant) {
      setStatus({ message: `✗ SKU "${sku}" not found in system`, type: "error" });
      return;
    }
    setPendingSku(sku);
    setPendingVariant(variant);
    setQuantity(1);
    setCustomerMode("existing");
    setSelectedCustomerId("");
    setNewCustomerName("");
    setNewCustomerPhone("");
    setManualSku("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Checkout Modal */}
      {pendingSku && pendingVariant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-orange-50 p-5 border-b border-orange-100">
              <p className="text-sm text-orange-600 font-medium">Checkout</p>
              <p className="text-xl font-bold text-gray-900 font-mono mt-1">{pendingSku}</p>
              <p className="text-sm text-gray-500">{pendingVariant.product?.name} — {pendingVariant.color}</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} autoFocus
                  className="w-full text-center text-2xl font-bold border-2 border-gray-300 rounded-xl py-2 focus:border-orange-500 outline-none" />
              </div>

              {/* Customer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Selling to</label>
                  <button onClick={() => setCustomerMode(customerMode === "existing" ? "new" : "existing")}
                    className="text-xs text-orange-600 hover:underline font-medium">
                    {customerMode === "existing" ? "+ New customer" : "Pick existing"}
                  </button>
                </div>
                {customerMode === "existing" ? (
                  <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:border-orange-500 outline-none">
                    <option value="">Select customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Customer Name *"
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-orange-500 outline-none" />
                    <input value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} placeholder="Phone *"
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-orange-500 outline-none" />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50">
              <button onClick={() => { setPendingSku(null); setPendingVariant(null); }} disabled={submitting}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 text-sm font-medium">Cancel</button>
              <button onClick={handleCheckout} disabled={submitting}
                className="flex-1 bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 text-sm font-bold disabled:opacity-50">
                {submitting ? "Processing..." : `Sell ${quantity} unit(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner + Manual Input */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">📷</span>
            <div>
              <h3 className="text-base font-semibold text-gray-800">Scan & Checkout</h3>
              <p className="text-xs text-gray-400">Scan QR or type SKU manually below</p>
            </div>
          </div>
          <div id="reader" className="w-full rounded-lg overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50" />
        </div>

        {/* Manual SKU fallback */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-2">Scanner not working? Type the SKU manually:</p>
          <div className="flex gap-2">
            <input value={manualSku} onChange={e => setManualSku(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleManualLookup()}
              placeholder="Enter SKU (e.g. MK-001-BLK)"
              className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm font-mono focus:border-orange-500 outline-none" />
            <button onClick={handleManualLookup}
              className="bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 shrink-0">
              Look Up
            </button>
          </div>
        </div>

        {status.message && (
          <div className={`p-4 rounded-xl text-sm font-medium ${
            status.type === "success" ? "bg-green-50 text-green-800 border border-green-200" :
            status.type === "error" ? "bg-red-50 text-red-800 border border-red-200" :
            "bg-blue-50 text-blue-800 border border-blue-200"
          }`}>{status.message}</div>
        )}
      </div>

      {/* Session History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Today's Checkouts</h3>
        {scanHistory.length === 0 ? (
          <p className="text-gray-400 text-sm">No checkouts yet. Scan a QR to start.</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {scanHistory.map((entry, i) => (
              <div key={i} className={`p-3 rounded-lg ${entry.status === "success" ? "bg-green-50" : "bg-red-50"}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-mono font-medium text-gray-900">{entry.sku}</p>
                    <p className={`text-xs ${entry.status === "success" ? "text-green-600" : "text-red-600"}`}>{entry.message}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-700">×{entry.quantity}</p>
                    <p className="text-xs text-gray-400">{entry.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
