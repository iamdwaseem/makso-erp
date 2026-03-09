import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api";

type PeriodFilter = "day" | "week" | "month" | "year" | "all";

function startOf(period: PeriodFilter): Date | null {
  const now = new Date();
  if (period === "day") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") {
    const d = new Date(now); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d;
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "year")  return new Date(now.getFullYear(), 0, 1);
  return null;
}

export function History() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [sales, setSales]         = useState<any[]>([]);
  const [typeTab, setTypeTab]     = useState<"all" | "entry" | "exit">("all");
  const [period, setPeriod]       = useState<PeriodFilter>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    api.get("/purchases").then(r => setPurchases(r.data)).catch(console.error);
    api.get("/sales").then(r => setSales(r.data)).catch(console.error);
  }, []);

  const allEntries = useMemo(() => [
    ...purchases.map(p => ({ ...p, type: "entry" as const, date: p.purchase_date || p.created_at })),
    ...sales.map(s     => ({ ...s, type: "exit"  as const, date: s.sale_date    || s.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [purchases, sales]);

  const filtered = useMemo(() => {
    const cutoff = startOf(period);
    return allEntries.filter(e => {
      if (typeTab !== "all" && e.type !== typeTab) return false;
      if (cutoff && new Date(e.date) < cutoff) return false;
      return true;
    });
  }, [allEntries, typeTab, period]);

  // ── Stats for the current view ───────────────────────────────────────────
  const totalIn  = filtered.filter(e => e.type === "entry").reduce((s, e) => s + (e.items?.reduce((ss: number, i: any) => ss + i.quantity, 0) || 0), 0);
  const totalOut = filtered.filter(e => e.type === "exit" ).reduce((s, e) => s + (e.items?.reduce((ss: number, i: any) => ss + i.quantity, 0) || 0), 0);

  // ── CSV export ───────────────────────────────────────────────────────────
  const exportCsv = () => {
    const rows: string[][] = [["Type", "Date", "Invoice #", "Party", "Product", "Variant", "SKU", "Qty"]];
    filtered.forEach(entry => {
      const isEntry = entry.type === "entry";
      const party = isEntry ? entry.supplier?.name : entry.customer?.name;
      entry.items?.forEach((item: any) => {
        rows.push([
          isEntry ? "Entry" : "Exit",
          new Date(entry.date).toLocaleString(),
          entry.invoice_number || "",
          party || "",
          item.variant?.product?.name || "",
          item.variant?.color || "",
          item.variant?.sku || "",
          String(item.quantity),
        ]);
      });
    });
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `wareflow_history_${period}_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── PDF export ───────────────────────────────────────────────────────────
  const exportPdf = () => {
    const doc = new jsPDF();
    const periodLabel = period === "all" ? "All Time" :
      period === "day" ? "Today" : period === "week" ? "This Week" :
      period === "month" ? "This Month" : "This Year";

    doc.setFontSize(18); doc.setFont("helvetica", "bold");
    doc.text("WareFlow — Transaction History", 14, 18);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(`Period: ${periodLabel}   |   Generated: ${new Date().toLocaleString()}`, 14, 26);
    doc.setTextColor(0);

    const tableRows: any[] = [];
    filtered.forEach(entry => {
      const isEntry = entry.type === "entry";
      const party = isEntry ? entry.supplier?.name : entry.customer?.name;
      entry.items?.forEach((item: any) => {
        tableRows.push([
          isEntry ? "Entry" : "Exit",
          new Date(entry.date).toLocaleDateString(),
          entry.invoice_number || "—",
          party || "—",
          item.variant?.product?.name || "—",
          item.variant?.color || "—",
          item.variant?.sku || "—",
          item.quantity,
        ]);
      });
    });

    autoTable(doc, {
      startY: 32,
      head: [["Type", "Date", "Invoice #", "Party", "Product", "Variant", "SKU", "Qty"]],
      body: tableRows,
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [246, 248, 255] },
      columnStyles: { 7: { halign: "right" } },
    });

    doc.save(`wareflow_history_${period}_${Date.now()}.pdf`);
  };

  // ── Invoice print ────────────────────────────────────────────────────────
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
        .meta { text-align: right; font-size: 13px; color: #555; }
        .party { margin-bottom: 24px; padding: 16px; background: #f8f8f8; border-radius: 8px; }
        .party-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
        .party-name { font-size: 18px; font-weight: 600; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #f0f0f0; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #666; }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>${el.innerHTML}
    <div class="footer">WareFlow — Generated ${new Date().toLocaleString()}</div>
    <script>window.print();</script></body></html>`);
  };

  const periodLabels: Record<PeriodFilter, string> = { day: "Today", week: "This Week", month: "This Month", year: "This Year", all: "All Time" };

  return (
    <div className="space-y-4">

      {/* ── Invoice Modal ─────────────────────────────────────────────────── */}
      {selectedInvoice && (() => {
        const inv = selectedInvoice;
        const isEntry = inv.type === "entry";
        const partyName    = isEntry ? inv.supplier?.name    : inv.customer?.name;
        const partyPhone   = isEntry ? inv.supplier?.phone   : inv.customer?.phone;
        const partyEmail   = isEntry ? inv.supplier?.email   : inv.customer?.email;
        const partyAddress = isEntry ? inv.supplier?.address : inv.customer?.address;
        const totalUnits   = inv.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;

        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedInvoice(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div id="invoice-print-area">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {isEntry ? "📥 Stock Entry Invoice" : "📤 Stock Exit Invoice"}
                      </h2>
                      <p className="text-sm text-gray-400 mt-1">WareFlow ERP</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-bold px-3 py-1.5 rounded-lg inline-block ${isEntry ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                        {inv.invoice_number || "—"}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(inv.date).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 pt-5">
                  <div className={`p-4 rounded-xl ${isEntry ? "bg-blue-50/50 border border-blue-100" : "bg-green-50/50 border border-green-100"}`}>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                      {isEntry ? "Received From (Supplier)" : "Sold To (Customer)"}
                    </p>
                    <p className={`text-lg font-bold mt-1 ${isEntry ? "text-blue-800" : "text-green-800"}`}>{partyName || "Unknown"}</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-gray-600">
                      {partyPhone   && <span>📞 {partyPhone}</span>}
                      {partyEmail   && <span>✉️ {partyEmail}</span>}
                      {partyAddress && <span>📍 {partyAddress}</span>}
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
                      {inv.items?.map((item: any, idx: number) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3 px-3 text-sm text-gray-400">{idx + 1}</td>
                          <td className="py-3 px-3 text-sm font-medium text-gray-900">{item.variant?.product?.name || "—"}</td>
                          <td className="py-3 px-3 text-sm text-gray-600">{item.variant?.color || "—"}</td>
                          <td className="py-3 px-3 text-sm text-gray-500 font-mono">{item.variant?.sku || "—"}</td>
                          <td className={`py-3 px-3 text-sm text-right font-bold ${isEntry ? "text-green-700" : "text-orange-600"}`}>
                            {isEntry ? "+" : "-"}{item.quantity}
                          </td>
                        </tr>
                      ))}
                      <tr className={isEntry ? "bg-green-50" : "bg-orange-50"}>
                        <td colSpan={4} className="py-3 px-3 text-sm font-bold text-gray-900 text-right">Total Units</td>
                        <td className={`py-3 px-3 text-sm text-right font-bold ${isEntry ? "text-green-700" : "text-orange-600"}`}>
                          {isEntry ? "+" : "-"}{totalUnits}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="px-6 pb-4">
                  <p className="text-xs text-gray-400">Transaction ID: <span className="font-mono">{inv.id}</span></p>
                </div>
              </div>

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

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Type tabs */}
          <div className="flex gap-1.5">
            {([
              { key: "all",   label: "All" },
              { key: "entry", label: "📥 Entries" },
              { key: "exit",  label: "📤 Exits" },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTypeTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeTab === t.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Period tabs */}
          <div className="flex gap-1.5">
            {(["day","week","month","year","all"] as PeriodFilter[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {periodLabels[p]}
              </button>
            ))}
          </div>

          {/* Export buttons — pushed right */}
          <div className="ml-auto flex gap-2">
            <button onClick={exportCsv} disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-40 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
            <button onClick={exportPdf} disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-40 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary chips ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
          <span className="text-xl">📋</span>
          <div>
            <div className="text-lg font-bold text-gray-900">{filtered.length}</div>
            <div className="text-xs text-gray-400">{periodLabels[period]} transactions</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm px-4 py-3 flex items-center gap-3">
          <span className="text-xl">📥</span>
          <div>
            <div className="text-lg font-bold text-emerald-700">+{totalIn}</div>
            <div className="text-xs text-gray-400">units received</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm px-4 py-3 flex items-center gap-3">
          <span className="text-xl">📤</span>
          <div>
            <div className="text-lg font-bold text-orange-600">−{totalOut}</div>
            <div className="text-xs text-gray-400">units sold</div>
          </div>
        </div>
      </div>

      {/* ── Records ───────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          No records for <span className="font-medium">{periodLabels[period]}</span>.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => {
            const isEntry   = entry.type === "entry";
            const totalUnits = entry.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
            const partyName  = isEntry ? entry.supplier?.name : entry.customer?.name;
            const partyPhone = isEntry ? entry.supplier?.phone : entry.customer?.phone;

            return (
              <div key={entry.id}
                onClick={() => setSelectedInvoice(entry)}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-blue-200 hover:shadow-md transition-all">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${isEntry ? "bg-green-500" : "bg-orange-500"}`}>
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
                        <p className={`text-xs px-2 py-1 rounded font-mono ${isEntry ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                          {entry.invoice_number}
                        </p>
                      )}
                      <p className={`text-sm font-bold mt-1 ${isEntry ? "text-green-700" : "text-orange-600"}`}>
                        {isEntry ? "+" : "-"}{totalUnits} units
                      </p>
                      <p className="text-xs text-blue-500 mt-1">View details →</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50/50">
                  {entry.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm py-0.5">
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
