"use client";

import { useMemo, useState } from "react";
import QuotationTable from "@/components/purchase/quotation/QuotationTable";
import QuotationFilters from "@/components/purchase/quotation/QuotationFilters";
import QuotationForm from "@/components/purchase/quotation/QuotationForm";
import QuotationView from "@/components/purchase/quotation/QuotationView";
import {
  purchaseQuotationsMock,
  type PurchaseQuotation,
} from "@/mock/purchaseQuotations";

type ViewMode = "list" | "form" | "view";

export default function PurchaseQuotationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuotation, setSelectedQuotation] = useState<PurchaseQuotation | null>(null);

  const filteredQuotations = useMemo(() => {
    if (statusFilter === "all") return purchaseQuotationsMock;
    return purchaseQuotationsMock.filter((q) => q.status === statusFilter);
  }, [statusFilter]);

  return (
    <div className="p-6">
      {viewMode === "list" && (
        <>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                PURCHASE QUOTATIONS
              </h1>
              <QuotationFilters status={statusFilter} onStatusChange={setStatusFilter} />
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
          <QuotationTable
            quotations={filteredQuotations}
            onView={(q) => {
              setSelectedQuotation(q);
              setViewMode("view");
            }}
          />
        </>
      )}

      {viewMode === "form" && (
        <>
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              PURCHASE QUOTATION
            </h1>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <QuotationForm
              onSave={() => setViewMode("list")}
              onSaveAndApprove={() => setViewMode("list")}
              onReset={() => {}}
              onCancel={() => setViewMode("list")}
            />
          </div>
        </>
      )}

      {viewMode === "view" && selectedQuotation && (
        <>
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setSelectedQuotation(null);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to list
            </button>
          </div>
          <QuotationView
            quotation={selectedQuotation}
            onClose={() => {
              setViewMode("list");
              setSelectedQuotation(null);
            }}
          />
        </>
      )}
    </div>
  );
}
