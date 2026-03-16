"use client";

import { useCallback, useEffect, useState } from "react";
import PurchaseInvoiceTable, { type PurchaseInvoiceRow } from "@/components/purchase/invoices/PurchaseInvoiceTable";
import PurchaseInvoiceFilters from "@/components/purchase/invoices/PurchaseInvoiceFilters";
import PurchaseInvoiceForm, { type PurchaseCreatePayload } from "@/components/purchase/invoices/PurchaseInvoiceForm";
import { api } from "@/lib/api";

type ViewMode = "list" | "form";

function mapPurchaseToRow(p: any): PurchaseInvoiceRow {
  return {
    id: p.id,
    invoiceNo: p.id?.slice(0, 8),
    suppInvoiceNo: "—",
    supplier: p.supplier?.name ?? "—",
    gstn: "—",
    orderId: null,
    orderRef: null,
    invoiceDate: p.createdAt ? new Date(p.createdAt).toLocaleString() : "—",
    amount: Number(p.totalAmount ?? 0),
    payMode: "—",
    status: p.status ?? "DRAFT",
  };
}

export default function PurchaseInvoicesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [invoices, setInvoices] = useState<PurchaseInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("");
  const [supplier, setSupplier] = useState("");
  const [status, setStatus] = useState("all");
  const [invoiceNo, setInvoiceNo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPurchases({ page: 1, limit: 100 });
      setInvoices((res.data ?? []).map(mapPurchaseToRow));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = invoices.filter((i) => {
    if (status !== "all" && i.status !== status) return false;
    if (supplier && !(i.supplier ?? "").toLowerCase().includes(supplier.toLowerCase())) return false;
    if (invoiceNo && !(i.invoiceNo ?? i.id).toLowerCase().includes(invoiceNo.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6">
      {viewMode === "list" && (
        <>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">PURCHASE INVOICES</h1>
              <PurchaseInvoiceFilters
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                supplier={supplier}
                onSupplierChange={setSupplier}
                status={status}
                onStatusChange={setStatus}
                invoiceNo={invoiceNo}
                onInvoiceNoChange={setInvoiceNo}
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setViewMode("form")} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
              <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">EXPORT</button>
            </div>
          </div>
          {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}
          {loading ? <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div> : <PurchaseInvoiceTable invoices={filtered} />}
        </>
      )}
      {viewMode === "form" && (
        <>
          <div className="mb-4"><h1 className="text-2xl font-bold tracking-tight text-gray-900">NEW PURCHASE INVOICE</h1></div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <PurchaseInvoiceForm
            onSave={async (payload: PurchaseCreatePayload) => {
              try {
                await api.createPurchase(payload);
                load();
                setViewMode("list");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Create failed");
              }
            }}
            onCancel={() => setViewMode("list")}
          />
          </div>
        </>
      )}
    </div>
  );
}
