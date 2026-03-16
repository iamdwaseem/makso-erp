"use client";

import { useMemo, useState } from "react";
import MaterialRequestTable from "@/components/inventory/materialRequests/MaterialRequestTable";
import MaterialRequestForm from "@/components/inventory/materialRequests/MaterialRequestForm";
import { materialRequestsMock } from "@/mock/materialRequests";

type ViewMode = "list" | "form";

export default function MaterialRequestsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    if (status === "all") return materialRequestsMock;
    return materialRequestsMock.filter((r) => r.status === status);
  }, [status]);

  return (
    <div className="p-6">
      {viewMode === "list" && (
        <>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">MATERIAL REQUESTS</h1>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
                <option value="all">All</option>
                <option value="Approved">Approved</option>
                <option value="Draft">Draft</option>
                <option value="For revisal">For revisal</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button type="button" className="rounded border border-gray-200 bg-blue-600 p-1.5 text-white hover:bg-blue-700" aria-label="Filter">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setViewMode("form")} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
              <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">EXPORT</button>
            </div>
          </div>
          <MaterialRequestTable requests={filtered} />
        </>
      )}
      {viewMode === "form" && (
        <>
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
            <h1 className="text-lg font-semibold uppercase">NEW MATERIAL REQUEST</h1>
            <button type="button" onClick={() => setViewMode("list")} className="rounded p-2 text-white/90 hover:bg-white/10" aria-label="Close">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <MaterialRequestForm onSave={() => setViewMode("list")} onSaveAndApprove={() => setViewMode("list")} onReset={() => {}} onCancel={() => setViewMode("list")} />
          </div>
        </>
      )}
    </div>
  );
}
