import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Link } from "react-router-dom";
import { useWarehouseStore } from "../store/warehouseStore";
import { useApi } from "../hooks/useApi";
import api from "../api";
import { FEATURE_FLAGS } from "../featureFlags";

type PeriodFilter = "day" | "week" | "month" | "year" | "all" | "custom";

export function History() {
  const [page, setPage] = useState(1);
  const limit = 50;
  const [typeTab, setTypeTab] = useState<"all" | "entry" | "exit">("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [exportNotice, setExportNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const currentWarehouseId = useWarehouseStore(state => state.currentWarehouseId);

  const historyParams: Record<string, any> = {
    page,
    limit,
    type: typeTab === "all" ? undefined : typeTab,
    period,
    startDate: period === "custom" && customStartDate ? customStartDate : undefined,
    endDate: period === "custom" && customEndDate ? customEndDate : undefined,
  };

  const { data: historyData, meta: historyMeta, loading } = useApi<any[]>("/history", {
    params: historyParams,
    dependencies: [page, typeTab, period, customStartDate, customEndDate, currentWarehouseId]
  });

  const allEntries = historyData || [];
  const total = historyMeta?.total || 0;

  useEffect(() => {
    setPage(1);
  }, [typeTab, period, customStartDate, customEndDate, currentWarehouseId]);

  const triggerFileDownload = async (blob: Blob, fileName: string) => {
    const anyWindow = window as any;
    const ext = fileName.split(".").pop() || "bin";
    // showSaveFilePicker rejects text/csv;charset=utf-8 - always use anchor download for CSV
    const isCsv = blob.type?.includes("csv") || ext === "csv";
    if (!isCsv && "showSaveFilePicker" in window) {
      try {
        const mime = blob.type && !blob.type.includes("charset") ? blob.type : "application/octet-stream";
        const pickerHandle = await anyWindow.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: "Export file", accept: { [mime]: [`.${ext}`] } }]
        });
        const writable = await pickerHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch {
        /* fall through to anchor download */
      }
    }

    if (typeof anyWindow.navigator?.msSaveOrOpenBlob === "function") {
      anyWindow.navigator.msSaveOrOpenBlob(blob, fileName);
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const getExportEntries = async () => {
    const type = typeTab === "all" ? undefined : typeTab;
    if (period === "custom" && (!customStartDate || !customEndDate)) {
      throw new Error("Select both start and end date for custom range.");
    }
    const limitForExport = 500;
    let exportPage = 1;
    let totalPages = 1;
    const rows: any[] = [];

    do {
      const res = await api.get("/history", {
        params: {
          page: exportPage,
          limit: limitForExport,
          type,
          period,
          startDate: period === "custom" ? customStartDate : undefined,
          endDate: period === "custom" ? customEndDate : undefined,
        },
      });

      const chunk = res.data?.data || [];
      const meta = res.data?.meta || {};
      rows.push(...chunk);
      totalPages = Number(meta.totalPages || 1);
      exportPage += 1;
    } while (exportPage <= totalPages);

    return rows;
  };

  // ── CSV export (Now uses current page data) ────────────────────────────────
  const exportCsv = async () => {
    try {
      setExportNotice(null);
      setExporting("csv");
      const exportEntries = await getExportEntries();
      if (!exportEntries.length) {
        setExportNotice({ type: "error", text: "No history records available for CSV export." });
        return;
      }

      const rows: string[][] = [["Type", "Date", "Invoice #", "Party", "Product", "Variant", "SKU", "Qty"]];
      exportEntries.forEach(entry => {
        const isEntry = entry.type === "entry";
        const party = isEntry ? entry.supplier?.name : entry.customer?.name;
        entry.items?.forEach((item: any) => {
          rows.push([
            isEntry ? "Entry" : "Exit",
            new Date(entry.date).toLocaleString(),
            entry.invoiceNumber || "",
            party || "",
            item.variant?.product?.name || "",
            item.variant?.color || "",
            item.variant?.sku || "",
            String(item.quantity),
          ]);
        });
      });
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const fileName = `wareflow_history_${period}_${Date.now()}.csv`;
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      await triggerFileDownload(blob, fileName);
      setExportNotice({ type: "success", text: `CSV exported successfully (${exportEntries.length} records).` });
    } catch (err: any) {
      setExportNotice({ type: "error", text: err?.message || "CSV export failed. Please try again." });
    } finally {
      setExporting(null);
    }
  };

  // ── PDF export ───────────────────────────────────────────────────────────
  const exportPdf = async () => {
    try {
      setExportNotice(null);
      setExporting("pdf");
      const exportEntries = await getExportEntries();
      if (!exportEntries.length) {
        setExportNotice({ type: "error", text: "No history records available for PDF export." });
        return;
      }
      const doc = new jsPDF();

      doc.setFontSize(18); doc.setFont("helvetica", "bold");
      doc.text("WareFlow — Transaction History", 14, 18);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
      doc.setTextColor(0);

      const tableRows: any[] = [];
      exportEntries.forEach(entry => {
        const isEntry = entry.type === "entry";
        const party = isEntry ? entry.supplier?.name : entry.customer?.name;
        entry.items?.forEach((item: any) => {
          tableRows.push([
            isEntry ? "Entry" : "Exit",
            new Date(entry.date).toLocaleDateString(),
            entry.invoiceNumber || "—",
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

      const fileName = `wareflow_history_${Date.now()}.pdf`;
      const blob = doc.output("blob");
      await triggerFileDownload(blob, fileName);
      setExportNotice({ type: "success", text: `PDF exported successfully (${exportEntries.length} records).` });
    } catch (err: any) {
      setExportNotice({ type: "error", text: err?.message || "PDF export failed. Please try again." });
    } finally {
      setExporting(null);
    }
  };

  // const periodLabels: Record<PeriodFilter, string> = { day: "Today", week: "This Week", month: "This Month", year: "This Year", all: "All Time" };

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
                        {inv.invoiceNumber || "—"}
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
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <button onClick={() => setSelectedInvoice(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 text-sm font-medium">Close</button>
                {isEntry ? (
                  FEATURE_FLAGS.printInvoice ? (
                    <Link
                      to={`/inventory/print-invoice?id=${encodeURIComponent(String(inv.id))}`}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-sm font-medium text-center"
                    >
                      🖨️ Edit & Print
                    </Link>
                  ) : (
                    <Link
                      to={`/inventory/receipt-notes/${encodeURIComponent(String(inv.id))}`}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-sm font-medium text-center"
                    >
                      View GRN
                    </Link>
                  )
                ) : (
                  <Link
                    to={`/inventory/print-delivery-note?id=${encodeURIComponent(String(inv.id))}`}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-sm font-medium text-center"
                  >
                    🖨️ Edit & Print
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { key: "all",   label: "All" },
              { key: "entry", label: "📥 Entries" },
              { key: "exit",  label: "📤 Exits" },
            ] as const).map(t => (
              <button key={t.key} onClick={() => { setTypeTab(t.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeTab === t.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {t.label}
              </button>
            ))}

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-700"
            >
              <option value="all">All Time</option>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            {period === "custom" && (
              <>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-700"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-700"
                />
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={exportCsv} disabled={loading || total === 0 || exporting !== null || (period === "custom" && (!customStartDate || !customEndDate))}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">CSV</button>
            <button onClick={exportPdf} disabled={loading || total === 0 || exporting !== null || (period === "custom" && (!customStartDate || !customEndDate))}
              className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">PDF</button>
          </div>
        </div>
        {period === "custom" && (!customStartDate || !customEndDate) && (
          <div className="mt-3 text-xs font-medium px-3 py-2 rounded-lg border text-amber-700 bg-amber-50 border-amber-200">
            Select both start and end dates to apply custom filtering.
          </div>
        )}
        {exportNotice && (
          <div className={`mt-3 text-xs font-medium px-3 py-2 rounded-lg border ${
            exportNotice.type === "success"
              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : "text-red-700 bg-red-50 border-red-200"
          }`}>
            {exportNotice.text}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading history...</div>
      ) : allEntries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">No records found.</div>
      ) : (
        <div className="space-y-3">
          {allEntries.map(entry => {
            const isEntry = entry.type === "entry";
            const totalUnits = entry.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
            const partyName = isEntry ? entry.supplier?.name : entry.customer?.name;

            return (
              <div key={`${entry.type}-${entry.id}`} onClick={() => setSelectedInvoice(entry)}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-blue-200 hover:shadow-md transition-all">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isEntry ? "bg-green-500" : "bg-orange-500"}`}>
                      {isEntry ? "↓" : "↑"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{isEntry ? "Received from" : "Sold to"} <span className="text-blue-700">{partyName || "Unknown"}</span></p>
                      <p className="text-xs text-gray-400">{new Date(entry.date).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isEntry ? "text-green-700" : "text-orange-600"}`}>{isEntry ? "+" : "-"}{totalUnits} units</p>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">{entry.invoiceNumber || "No Invoice"}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {!loading && total > limit && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">← Previous</button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={allEntries.length < limit}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">Next →</button>
        </div>
      )}
    </div>
  );
}
