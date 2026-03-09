import { useEffect, useState } from "react";
import api from "../api";

export function History() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [tab, setTab] = useState<"all" | "entry" | "exit">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    api.get("/purchases").then(r => setPurchases(r.data)).catch(console.error);
    api.get("/sales").then(r => setSales(r.data)).catch(console.error);
  }, []);

  const allEntries = [
    ...purchases.map(p => ({ ...p, type: "entry" as const, date: p.purchase_date || p.created_at })),
    ...sales.map(s => ({ ...s, type: "exit" as const, date: s.sale_date || s.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = tab === "all" ? allEntries : allEntries.filter(e => e.type === tab);

  const printInvoice = () => {
    const el = document.getElementById("invoice-print-area");
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Invoice</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; max-width: 700px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: bold; }
        .subtitle { font-size: 12px; color: #666; margin-top: 4px; }
        .meta { text-align: right; font-size: 13px; color: #555; }
        .meta strong { color: #111; display: block; font-size: 14px; }
        .party { margin-bottom: 24px; padding: 16px; background: #f8f8f8; border-radius: 8px; }
        .party-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
        .party-name { font-size: 18px; font-weight: 600; margin-top: 4px; }
        .party-phone { font-size: 13px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #f0f0f0; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        .qty { text-align: right; font-weight: 700; }
        .total-row { background: #f8f8f8; font-weight: 700; font-size: 15px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>${el.innerHTML}
    <div class="footer">Warehouse ERP — Generated ${new Date().toLocaleString()}</div>
    <script>window.print();</script></body></html>`);
  };

  return (
    <div className="space-y-4">
      {/* Invoice Detail Modal */}
      {selectedInvoice && (() => {
        const inv = selectedInvoice;
        const isEntry = inv.type === "entry";
        const partyName = isEntry ? inv.supplier?.name : inv.customer?.name;
        const partyPhone = isEntry ? inv.supplier?.phone : inv.customer?.phone;
        const partyEmail = isEntry ? inv.supplier?.email : inv.customer?.email;
        const partyAddress = isEntry ? inv.supplier?.address : inv.customer?.address;
        const totalUnits = inv.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;

        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedInvoice(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div id="invoice-print-area">
                {/* Invoice Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {isEntry ? "📥 Stock Entry Invoice" : "📤 Stock Exit Invoice"}
                      </h2>
                      <p className="text-sm text-gray-400 mt-1">Warehouse ERP</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-bold px-3 py-1.5 rounded-lg inline-block ${
                        isEntry ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
                      }`}>{inv.invoice_number || "—"}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(inv.date).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Party Info */}
                <div className="px-6 pt-5">
                  <div className={`p-4 rounded-xl ${isEntry ? "bg-blue-50/50 border border-blue-100" : "bg-green-50/50 border border-green-100"}`}>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                      {isEntry ? "Received From (Supplier)" : "Sold To (Customer)"}
                    </p>
                    <p className={`text-lg font-bold mt-1 ${isEntry ? "text-blue-800" : "text-green-800"}`}>{partyName || "Unknown"}</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-gray-600">
                      {partyPhone && <span>📞 {partyPhone}</span>}
                      {partyEmail && <span>✉️ {partyEmail}</span>}
                      {partyAddress && <span>📍 {partyAddress}</span>}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="px-6 py-5">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">Variant</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                        {!isEntry && <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">Supplier</th>}
                        <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.items?.map((item: any, idx: number) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3 px-3 text-sm text-gray-400">{idx + 1}</td>
                          <td className="py-3 px-3 text-sm font-medium text-gray-900">{item.variant?.product?.name || "—"}</td>
                          <td className="py-3 px-3 text-sm text-gray-600">{item.variant?.color || "—"}</td>
                          <td className="py-3 px-3 text-sm text-gray-500 font-mono">{item.variant?.sku || "—"}</td>
                          {!isEntry && <td className="py-3 px-3 text-sm text-gray-600 italic">{item.supplier?.name || "—"}</td>}
                          <td className={`py-3 px-3 text-sm text-right font-bold ${isEntry ? "text-green-700" : "text-orange-600"}`}>
                            {isEntry ? "+" : "-"}{item.quantity}
                          </td>
                        </tr>
                      ))}
                      <tr className={`${isEntry ? "bg-green-50" : "bg-orange-50"}`}>
                        <td colSpan={isEntry ? 4 : 5} className="py-3 px-3 text-sm font-bold text-gray-900 text-right">Total Units</td>
                        <td className={`py-3 px-3 text-sm text-right font-bold ${isEntry ? "text-green-700" : "text-orange-600"}`}>
                          {isEntry ? "+" : "-"}{totalUnits}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Transaction ID */}
                <div className="px-6 pb-4">
                  <p className="text-xs text-gray-400">Transaction ID: <span className="font-mono">{inv.id}</span></p>
                </div>
              </div>

              {/* Actions (outside print area) */}
              <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <button onClick={() => setSelectedInvoice(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 text-sm font-medium">Close</button>
                <button onClick={printInvoice}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-sm font-bold">🖨️ Print Invoice</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "All", count: allEntries.length },
          { key: "entry", label: "📥 Entries", count: purchases.length },
          { key: "exit", label: "📤 Exits", count: sales.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
          No records yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => {
            const isEntry = entry.type === "entry";
            const totalUnits = entry.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
            const partyName = isEntry ? entry.supplier?.name : entry.customer?.name;
            const partyPhone = isEntry ? entry.supplier?.phone : entry.customer?.phone;

            return (
              <div key={entry.id}
                onClick={() => setSelectedInvoice(entry)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:border-blue-200 hover:shadow-md transition-all">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          isEntry ? "bg-green-500" : "bg-orange-500"}`}>
                          {isEntry ? "↓" : "↑"}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {isEntry ? "Received from" : "Sold to"}{" "}
                            <span className={isEntry ? "text-blue-700" : "text-green-700"}>{partyName || "Unknown"}</span>
                          </p>
                          {partyPhone && <p className="text-xs text-gray-400">📞 {partyPhone}</p>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 ml-9">{new Date(entry.date).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      {entry.invoice_number && (
                        <p className={`text-xs px-2 py-1 rounded font-mono ${
                          isEntry ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                          {entry.invoice_number}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        <span className={`font-bold ${isEntry ? "text-green-700" : "text-orange-600"}`}>
                          {isEntry ? "+" : "-"}{totalUnits} units
                        </span>
                      </p>
                      <p className="text-xs text-blue-500 mt-1">View details →</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50/50">
                  {entry.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span className="text-gray-700">
                        {item.variant?.product?.name} · {item.variant?.color}{" "}
                        <span className="text-gray-400 font-mono text-xs">({item.variant?.sku})</span>
                      </span>
                      <span className={`font-bold ${isEntry ? "text-green-700" : "text-orange-600"}`}>
                        {isEntry ? "+" : "-"}{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
