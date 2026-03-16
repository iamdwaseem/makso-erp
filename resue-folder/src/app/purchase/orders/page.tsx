"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PurchaseOrderTable from "@/components/purchase/orders/PurchaseOrderTable";
import PurchaseOrderFilters from "@/components/purchase/orders/PurchaseOrderFilters";
import PurchaseOrderForm from "@/components/purchase/orders/PurchaseOrderForm";
import { api } from "@/lib/api";

export type PurchaseOrderRow = {
  id: string;
  number: string;
  supplier: string;
  trn: string;
  contactPerson: string;
  quotationId: string | null;
  quotationRef: string | null;
  date: string;
  amount: number;
  status: string;
};

type ViewMode = "list" | "form";

export default function PurchaseOrdersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState<PurchaseOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPurchases({ page: 1, limit: 100 });
      const list = (res.data ?? []).map((p: any) => ({
        id: p.id,
        number: p.invoiceNumber ?? p.id?.slice(0, 8) ?? "—",
        supplier: (typeof p.supplier === "object" && p.supplier?.name) ? p.supplier.name : (p.supplierId ?? "—"),
        trn: "",
        contactPerson: "—",
        quotationId: null as string | null,
        quotationRef: null as string | null,
        date: p.purchaseDate ? new Date(p.purchaseDate).toLocaleString() : (p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"),
        amount: Number(p.grandTotal ?? p.total ?? 0),
        status: p.status ?? "DRAFT",
      }));
      setOrders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <div className="p-6">
      {viewMode === "list" && (
        <>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                PURCHASE ORDERS
              </h1>
              <PurchaseOrderFilters status={statusFilter} onStatusChange={setStatusFilter} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode("form")}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                NEW
              </button>
              <button
                type="button"
                className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                EXPORT
              </button>
            </div>
          </div>
          {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}
          {loading ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div>
          ) : (
            <PurchaseOrderTable orders={filteredOrders} />
          )}
        </>
      )}

      {viewMode === "form" && (
        <>
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              PURCHASE ORDER
            </h1>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <PurchaseOrderForm
              onSave={() => setViewMode("list")}
              onSaveAndApprove={() => setViewMode("list")}
              onReset={() => {}}
              onCancel={() => setViewMode("list")}
            />
          </div>
        </>
      )}
    </div>
  );
}
