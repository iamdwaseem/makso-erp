"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function ReceiptNoteDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [note, setNote] = useState<{
    receiptNo: string;
    date: string;
    onTransaction: string;
    sender: string;
    supplierOrCustomer: string;
    refNo: string | null;
    status: string;
    amount: number;
    items: { slNo: number; item: string; quantity: number; unit: string; batch?: string }[];
    carrier?: string;
    waybillNo?: string;
    vehicleNo?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const g = await api.getGrnById(id);
      const grn = g as any;
      const supplierName = typeof grn.supplier === "object" && grn.supplier?.name ? grn.supplier.name : grn.supplierId ?? "—";
      const warehouseName = typeof grn.warehouse === "object" && grn.warehouse?.name ? grn.warehouse.name : "—";
      const items = (grn.items ?? []).map((it: any, i: number) => ({
        slNo: i + 1,
        item: it.variant?.product?.name ?? it.variant?.sku ?? it.variantId ?? "—",
        quantity: Number(it.quantity ?? 0),
        unit: "PCS",
        batch: undefined as string | undefined,
      }));
      const amount = items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0); // or use backend total if available
      setNote({
        receiptNo: grn.grnNumber ?? grn.id?.slice(0, 8) ?? "—",
        date: grn.createdAt ? new Date(grn.createdAt).toLocaleString() : "—",
        onTransaction: "Purchase Order",
        sender: warehouseName,
        supplierOrCustomer: supplierName,
        refNo: grn.refNo ?? null,
        status: grn.status ?? "DRAFT",
        amount,
        items,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setNote(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await api.submitGrn(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this GRN? It will be marked as CANCELLED.")) return;
    setActionLoading(true);
    try {
      await api.cancelGrn(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (!id) {
    return (
      <div className="p-6">
        <Link href="/inventory/receipt-notes" className="text-sm text-blue-600 hover:underline">← Back to list</Link>
        <p className="mt-4 text-gray-600">Invalid ID.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Link href="/inventory/receipt-notes" className="text-sm text-blue-600 hover:underline">← Back to list</Link>
        <p className="mt-4 text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="p-6">
        <Link href="/inventory/receipt-notes" className="text-sm text-blue-600 hover:underline">← Back to list</Link>
        <p className="mt-4 text-red-600">{error ?? "Not found."}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/inventory/receipt-notes" className="text-sm text-blue-600 hover:underline">← Back to list</Link>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
          <h2 className="text-lg font-semibold uppercase">GOODS RECEIPT NOTE / {note.receiptNo}</h2>
        </div>
        <div className="p-6">
          <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <dt className="text-gray-500">Date</dt><dd>{note.date}</dd>
            <dt className="text-gray-500">On Transaction</dt><dd>{note.onTransaction}</dd>
            <dt className="text-gray-500">Sender</dt><dd>{note.sender}</dd>
            <dt className="text-gray-500">Supplier / Customer</dt><dd>{note.supplierOrCustomer}</dd>
            <dt className="text-gray-500">Ref No</dt><dd>{note.refNo ?? "—"}</dd>
            <dt className="text-gray-500">Status</dt><dd><span className="rounded bg-green-100 px-2 py-0.5 text-green-800">{note.status}</span></dd>
            {note.carrier && <><dt className="text-gray-500">Carrier</dt><dd>{note.carrier}</dd></>}
            {note.waybillNo && <><dt className="text-gray-500">Waybill No</dt><dd>{note.waybillNo}</dd></>}
            {note.vehicleNo && <><dt className="text-gray-500">Vehicle No</dt><dd>{note.vehicleNo}</dd></>}
          </dl>
          <h3 className="mb-2 text-sm font-semibold uppercase text-gray-700">Receipt items</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-2">Sl No</th>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Unit</th>
                <th className="px-4 py-2">Batch</th>
              </tr>
            </thead>
            <tbody>
              {note.items.map((row) => (
                <tr key={row.slNo} className="border-b border-gray-100">
                  <td className="px-4 py-2">{row.slNo}</td>
                  <td className="px-4 py-2">{row.item}</td>
                  <td className="px-4 py-2">{row.quantity}</td>
                  <td className="px-4 py-2">{row.unit}</td>
                  <td className="px-4 py-2">{row.batch ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm font-medium text-gray-700">Amount: {note.amount.toLocaleString()}</p>
          {note.status === "DRAFT" && (
            <div className="mt-6 flex gap-2 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={actionLoading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? "Processing…" : "Submit (stock in)"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel GRN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
