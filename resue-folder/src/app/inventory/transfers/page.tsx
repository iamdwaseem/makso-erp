"use client";

import { useCallback, useEffect, useState } from "react";
import InventoryTransferTable, { type TransferRow } from "@/components/inventory/transfers/InventoryTransferTable";
import InventoryTransferForm from "@/components/inventory/transfers/InventoryTransferForm";
import { api } from "@/lib/api";

type ViewMode = "list" | "form";

function mapTransferToRow(t: any): TransferRow {
  return {
    id: t.id,
    dateTime: t.createdAt ? new Date(t.createdAt).toLocaleString() : "—",
    fromCenter: (t.sourceWarehouse ?? t.fromWarehouse)?.name ?? "—",
    toCenter: (t.targetWarehouse ?? t.toWarehouse)?.name ?? "—",
    employee: "—",
    status: t.status ?? "DRAFT",
  };
}

export default function InventoryTransfersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTransfers({ page: 1, limit: 100 });
      setTransfers((res.data ?? []).map(mapTransferToRow));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6">
      {viewMode === "list" && (
        <>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">INVENTORY TRANSFER</h1>
            <div className="flex gap-2">
              <button type="button" onClick={() => setViewMode("form")} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
              <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">EXPORT</button>
            </div>
          </div>
          {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}
          {loading ? <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div> : <InventoryTransferTable transfers={transfers} />}
        </>
      )}
      {viewMode === "form" && (
        <>
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
            <h1 className="text-lg font-semibold uppercase">NEW INVENTORY TRANSFER</h1>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setViewMode("list")} className="rounded border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10">Cancel</button>
              <button type="button" onClick={() => setViewMode("list")} className="rounded p-2 text-white/90 hover:bg-white/10" aria-label="Close">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <InventoryTransferForm
              onSave={async (payload) => {
                try {
                  await api.createTransfer(payload);
                  load();
                  setViewMode("list");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Create failed");
                }
              }}
              onSaveAndApprove={async (payload) => {
                try {
                  const created = await api.createTransfer(payload);
                  const id = (created as any)?.id;
                  if (id) await api.submitTransfer(id);
                  load();
                  setViewMode("list");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Create or submit failed");
                }
              }}
              onReset={() => {}}
              onCancel={() => setViewMode("list")}
            />
          </div>
        </>
      )}
    </div>
  );
}
