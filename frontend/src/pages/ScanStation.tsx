import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../api";
import { useWarehouseStore } from "../store/warehouseStore";
import { useScanner } from "../hooks/useScanner";
import { Link } from "react-router-dom";

interface ScanEntry {
  sku: string;
  customerName: string;
  quantity: number;
  status: "success" | "error";
  message: string;
  time: string;
}

interface CartItem {
  variantId: string;
  sku: string;
  label: string; // "ProductName — Color"
  quantity: number;
}

// ── localStorage helpers ─────────────────────────────────────────────────────
const TODAY_KEY = `wareflow_checkouts_${new Date().toISOString().slice(0, 10)}`;

function loadTodaysHistory(): ScanEntry[] {
  try { return JSON.parse(localStorage.getItem(TODAY_KEY) || "[]"); } catch { return []; }
}
function saveTodaysHistory(entries: ScanEntry[]) {
  localStorage.setItem(TODAY_KEY, JSON.stringify(entries));
  Object.keys(localStorage)
    .filter(k => k.startsWith("wareflow_checkouts_") && k !== TODAY_KEY)
    .forEach(k => localStorage.removeItem(k));
}
// ────────────────────────────────────────────────────────────────────────────

export function ScanStation() {
  const [scanHistory, setScanHistory] = useState<ScanEntry[]>(loadTodaysHistory);
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" | "" }>({ message: "", type: "" });

  // ── Cart ─────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);

  // ── Checkout modal ────────────────────────────────────────────────────────
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [manualSku, setManualSku] = useState("");
  const [completedSale, setCompletedSale] = useState<any>(null);
  const currentWarehouseId = useWarehouseStore(state => state.currentWarehouseId);

  const lastScanRef = useRef<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerMountedRef = useRef(false);

  useEffect(() => {
    api.get("/customers", { params: { limit: 1000 } }).then(r => setCustomers(r.data.data)).catch(console.error);
  }, []);

  useEffect(() => { saveTodaysHistory(scanHistory); }, [scanHistory]);

  // ── Add/increment an item in the cart ────────────────────────────────────
  const addToCart = (variant: any, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(c => c.variantId === variant.id);
      if (existing) {
        return prev.map(c => c.variantId === variant.id ? { ...c, quantity: c.quantity + qty } : c);
      }
      return [...prev, {
        variantId: variant.id,
        sku: variant.sku,
        label: `${variant.product?.name} — ${variant.color}`,
        quantity: qty,
      }];
    });
  };

  const updateCartQty = (variantId: string, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map(c => c.variantId === variantId ? { ...c, quantity: qty } : c));
  };

  const removeFromCart = (variantId: string) => {
    setCart(prev => prev.filter(c => c.variantId !== variantId));
  };

  const clearCart = () => setCart([]);

  const processScannedCode = (decodedText: string) => {
    if (lastScanRef.current === decodedText) return;
    lastScanRef.current = decodedText;

    let apiPath = `/variants/sku/${decodedText}`;
    let displayCode = decodedText;

    if (decodedText.startsWith("VAR:")) {
      const variantId = decodedText.replace("VAR:", "");
      apiPath = `/variants/${variantId}`;
      displayCode = variantId;
    }

    setStatus({ message: `🔍 Looking up item: ${displayCode}...`, type: "" });

    api.get(apiPath)
      .then(res => {
        const variant = res.data;
        addToCart(variant, 1);
        setStatus({ message: `+ Added: ${variant.product?.name} — ${variant.color}`, type: "success" });
        setTimeout(() => { lastScanRef.current = null; setStatus({ message: "", type: "" }); }, 2000);
      })
      .catch(err => {
        const msg = err.response?.status === 404 ? `✗ Item "${displayCode}" not found` : "✗ Error looking up item";
        setStatus({ message: msg, type: "error" });
        setTimeout(() => { lastScanRef.current = null; }, 2000);
      });
  };

  // Hardware scanner integration
  useScanner(processScannedCode);

  // ── QR scanner (Camera) ──────────────────────────────────────────────────
  useEffect(() => {
    if (scannerMountedRef.current) return;
    scannerMountedRef.current = true;

    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scannerRef.current = scanner;
    scanner.render(processScannedCode, () => {});

    return () => {
      const activeScanner = scannerRef.current;
      scannerRef.current = null;
      scannerMountedRef.current = false;
      if (activeScanner) {
        activeScanner.clear().catch(() => {});
      }
    };
  }, []); 

  // ── Manual SKU lookup ────────────────────────────────────────────────────
  const handleManualLookup = () => {
    const sku = manualSku.trim();
    if (!sku) return;
    
    setStatus({ message: `🔍 Looking up SKU: ${sku}...`, type: "" });

    api.get(`/variants/sku/${sku}`)
      .then(res => {
        const variant = res.data;
        addToCart(variant, 1);
        setStatus({ message: `+ Added: ${variant.product?.name} — ${variant.color}`, type: "success" });
        setManualSku("");
        setTimeout(() => setStatus({ message: "", type: "" }), 2000);
      })
      .catch(err => {
        const msg = err.response?.status === 404 ? `✗ SKU "${sku}" not found` : "✗ Error looking up SKU";
        setStatus({ message: msg, type: "error" });
      });
  };

  // ── Confirm checkout ──────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);

    try {
      let customerId = selectedCustomerId;

      if (customerMode === "new") {
        if (!newCustomerName || !newCustomerPhone) {
          alert("Customer name and phone are required");
          setSubmitting(false);
          return;
        }
        const customerRes = await api.post("/customers", {
          name: newCustomerName, phone: newCustomerPhone,
          ...(newCustomerAddress ? { address: newCustomerAddress } : {}),
        });
        customerId = customerRes.data.id;
        setCustomers(prev => [...prev, customerRes.data]);
      }

      if (!customerId) {
        alert("Please select or add a customer");
        setSubmitting(false);
        return;
      }
      if (currentWarehouseId === "all") {
        alert("Please select a specific warehouse in the header to record sales.");
        setSubmitting(false);
        return;
      }

      const saleRes = await api.post("/sales", {
        customerId: customerId,
        warehouseId: currentWarehouseId,
        items: cart.map(c => ({ variantId: c.variantId, quantity: c.quantity })),
      });
      const sale = saleRes.data;

      const customerName = customerMode === "new"
        ? newCustomerName
        : customers.find(c => c.id === customerId)?.name || "Customer";

      const totalUnits = cart.reduce((sum, c) => sum + c.quantity, 0);
      const entry: ScanEntry = {
        sku: cart.map(c => c.sku).join(", "),
        customerName,
        quantity: totalUnits,
        status: "success",
        message: `${cart.length} product(s), ${totalUnits} unit(s) → ${customerName}`,
        time: new Date().toLocaleTimeString(),
      };
      setScanHistory(prev => [entry, ...prev]);
      setStatus({ message: `✓ Sale recorded — ${cart.length} product(s), ${totalUnits} unit(s) sold to ${customerName}`, type: "success" });
      clearCart();
      setCheckoutOpen(false);
      setSelectedCustomerId(""); setNewCustomerName(""); setNewCustomerPhone(""); setNewCustomerAddress("");
      setCompletedSale(sale);
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message;
      const entry: ScanEntry = {
        sku: cart.map(c => c.sku).join(", "),
        customerName: "", quantity: 0,
        status: "error", message: msg, time: new Date().toLocaleTimeString(),
      };
      setScanHistory(prev => [entry, ...prev]);
      setStatus({ message: `✗ ${msg}`, type: "error" });
    }
    setSubmitting(false);
  };

  const totalUnits = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── Checkout Modal ──────────────────────────────────────────────────── */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-orange-50 p-5 border-b border-orange-100">
              <p className="text-sm text-orange-600 font-medium">Confirm Sale</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {cart.length} product{cart.length !== 1 ? "s" : ""} · {totalUnits} unit{totalUnits !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Order summary */}
            <div className="px-5 pt-4 pb-2 max-h-40 overflow-y-auto space-y-1">
              {cart.map(item => (
                <div key={item.variantId} className="flex justify-between text-sm text-gray-700">
                  <span className="truncate">{item.label}</span>
                  <span className="font-semibold shrink-0 ml-2">×{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="px-5 pb-5 pt-3 space-y-4 border-t border-gray-100">
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
                    <input value={newCustomerAddress} onChange={e => setNewCustomerAddress(e.target.value)} placeholder="Address (optional)"
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-orange-500 outline-none" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setCheckoutOpen(false)} disabled={submitting}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 text-sm font-medium">Cancel</button>
              <button onClick={handleCheckout} disabled={submitting}
                className="flex-1 bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 text-sm font-bold disabled:opacity-50">
                {submitting ? "Processing..." : `Confirm Sale`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice Modal (after checkout) ───────────────────────────────────── */}
      {completedSale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setCompletedSale(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div id="scan-invoice-print-area">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">📤 Sale Invoice</h2>
                    <p className="text-sm text-gray-400 mt-1">WareFlow ERP</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold px-3 py-1.5 rounded-lg inline-block bg-green-50 text-green-700">
                      {completedSale.invoice_number || "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(completedSale.sale_date || completedSale.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 pt-5">
                <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Sold To (Customer)</p>
                  <p className="text-lg font-bold mt-1 text-green-800">{completedSale.customer?.name || "Unknown"}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-gray-600">
                    {completedSale.customer?.phone && <span>📞 {completedSale.customer.phone}</span>}
                    {completedSale.customer?.email && <span>✉️ {completedSale.customer.email}</span>}
                    {completedSale.customer?.address && <span>📍 {completedSale.customer.address}</span>}
                  </div>
                </div>
              </div>
              <div className="px-6 py-5">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">Variant</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedSale.items?.map((item: any, idx: number) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-3 px-3 text-sm text-gray-400">{idx + 1}</td>
                        <td className="py-3 px-3 text-sm font-medium text-gray-900">
                          {item.variant?.product?.name || "—"}
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-600">{item.variant?.color || "—"}</td>
                        <td className="py-3 px-3 text-sm text-gray-500 font-mono">{item.variant?.sku || "—"}</td>
                        <td className="py-3 px-3 text-sm text-right font-bold text-orange-600">-{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setCompletedSale(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 text-sm font-medium">Close</button>
              <Link
                to={`/inventory/print-delivery-note?id=${encodeURIComponent(completedSale.id)}`}
                className="flex-1 bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 text-sm font-bold text-center"
              >
                🖨️ Print Delivery Note
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Left column: scanner + cart ─────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Scanner */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">📷</span>
            <div>
              <h3 className="text-base font-semibold text-gray-800">Scan Products</h3>
              <p className="text-xs text-gray-400">Each scan adds the item to your cart</p>
            </div>
          </div>
          <div id="reader" className="w-full rounded-lg overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50" />
        </div>

        {/* Manual SKU */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-2">Or enter SKU manually:</p>
          <div className="flex gap-2">
            <input value={manualSku} onChange={e => setManualSku(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleManualLookup()}
              placeholder="e.g. MK-001-BLK"
              className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm font-mono focus:border-orange-500 outline-none" />
            <button onClick={handleManualLookup}
              className="bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 shrink-0">
              Add
            </button>
          </div>
        </div>

        {status.message && (
          <div className={`p-4 rounded-xl text-sm font-medium ${
            status.type === "success" ? "bg-green-50 text-green-800 border border-green-200" :
            "bg-red-50 text-red-800 border border-red-200"
          }`}>{status.message}</div>
        )}

        {/* Cart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-800">
              Cart
              {cart.length > 0 && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded-full">
                  {cart.length} item{cart.length !== 1 ? "s" : ""} · {totalUnits} unit{totalUnits !== 1 ? "s" : ""}
                </span>
              )}
            </h3>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                Clear all
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400">Scan a barcode or enter a SKU to add items.</p>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.variantId}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-7 h-7 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center text-base leading-none font-bold">−</button>
                    <input
                      type="number" min="1" value={item.quantity}
                      onChange={e => updateCartQty(item.variantId, parseInt(e.target.value) || 1)}
                      className="w-12 text-center text-sm font-bold border border-gray-200 rounded-md py-1 outline-none focus:border-orange-400"
                    />
                    <button onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                      className="w-7 h-7 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-base leading-none font-bold">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.variantId)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              <button
                onClick={() => setCheckoutOpen(true)}
                disabled={cart.length === 0}
                className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
                Checkout — {cart.length} product{cart.length !== 1 ? "s" : ""}, {totalUnits} unit{totalUnits !== 1 ? "s" : ""}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right column: today's history ───────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Today's Checkouts</h3>
          {scanHistory.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded-full">
              {scanHistory.filter(e => e.status === "success").length} sale{scanHistory.filter(e => e.status === "success").length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {scanHistory.length === 0 ? (
          <p className="text-gray-400 text-sm">No checkouts yet. Scan a barcode to start.</p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {scanHistory.map((entry, i) => (
              <div key={i} className={`p-3 rounded-lg ${entry.status === "success" ? "bg-green-50" : "bg-red-50"}`}>
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className={`text-xs font-medium ${entry.status === "success" ? "text-green-700" : "text-red-600"}`}>
                      {entry.message}
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{entry.sku}</p>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0 ml-2">{entry.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
