"use client";

import { useCallback, useEffect, useState } from "react";
import DeliveryNoteTable, { type DeliveryNoteRow } from "@/components/inventory/deliveryNotes/DeliveryNoteTable";
import DeliveryNoteForm, { type GdnCreatePayload } from "@/components/inventory/deliveryNotes/DeliveryNoteForm";
import { api } from "@/lib/api";

type ViewMode = "list" | "form";

const STATUS_OPTIONS = ["all", "DRAFT", "SUBMITTED", "CANCELLED"];

function mapGdnToRow(g: any): DeliveryNoteRow {
  const items = g.items ?? [];
  const amount = items.reduce((s: number, i: any) => s + Number(i.quantity ?? 0) * 0, 0);
  return {
    id: g.id,
    deliveryNo: g.id?.slice(0, 8),
    date: g.createdAt ? new Date(g.createdAt).toLocaleString() : "—",
    customer: (g.customer as any)?.name ?? "—",
    center: (g.warehouse as any)?.name ?? "—",
    onTransaction: "GDN",
    amount,
    status: g.status ?? "DRAFT",
  };
}

export default function GoodsDeliveryNotesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [notes, setNotes] = useState<DeliveryNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getGdnList({ page: 1, limit: 100 });
      setNotes((res.data ?? []).map(mapGdnToRow));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = statusFilter === "all" ? notes : notes.filter((n) => n.status === statusFilter);

  return (
    <div className="p-6">
      {viewMode === "list" && (
        <>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">GOODS DELIVERY NOTE</h1>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s === "all" ? "All" : s}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setViewMode("form")} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
              <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">EXPORT</button>
            </div>
          </div>
          {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}
          {loading ? <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div> : <DeliveryNoteTable notes={filtered} />}
        </>
      )}
      {viewMode === "form" && (
        <>
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
            <h1 className="text-lg font-semibold uppercase">NEW GOODS DELIVERY NOTE</h1>
            <button type="button" onClick={() => setViewMode("list")} className="rounded p-2 text-white/90 hover:bg-white/10" aria-label="Close">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <DeliveryNoteForm
            onSave={async (payload: GdnCreatePayload) => {
              try {
                await api.createGdn(payload);
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
