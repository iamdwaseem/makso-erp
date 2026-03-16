"use client";

import { useMemo, useState } from "react";
import DebitNoteTable from "@/components/purchase/debitNotes/DebitNoteTable";
import DebitNoteFilters from "@/components/purchase/debitNotes/DebitNoteFilters";
import DebitNoteForm from "@/components/purchase/debitNotes/DebitNoteForm";
import { debitNotesMock } from "@/mock/debitNotes";

type ViewMode = "list" | "form";

export default function DebitNotesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    if (status === "all") return debitNotesMock;
    return debitNotesMock.filter((n) => n.status === status);
  }, [status]);

  return (
    <div className="p-6">
      {viewMode === "list" && (
        <>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">DEBIT NOTE</h1>
              <DebitNoteFilters status={status} onStatusChange={setStatus} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setViewMode("form")} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
              <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">EXPORT</button>
            </div>
          </div>
          <DebitNoteTable notes={filtered} />
        </>
      )}
      {viewMode === "form" && (
        <>
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
            <h1 className="text-lg font-semibold uppercase">DEBIT NOTE</h1>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <DebitNoteForm onSave={() => setViewMode("list")} onSaveAndApprove={() => setViewMode("list")} onReset={() => {}} onCancel={() => setViewMode("list")} />
          </div>
        </>
      )}
    </div>
  );
}
