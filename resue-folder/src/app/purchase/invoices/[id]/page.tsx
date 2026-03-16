"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PurchaseInvoiceView, { type PurchaseInvoiceDetailView } from "@/components/purchase/invoices/PurchaseInvoiceView";
import { api } from "@/lib/api";

export default function PurchaseInvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<PurchaseInvoiceDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getPurchaseById(id)
      .then((p) => {
        const supplier = p.supplier as { name?: string; address?: string; phone?: string } | undefined;
        const items = (p.items ?? []).map((it: any, idx: number) => {
          const variant = it.variant;
          const product = variant?.product;
          const cost = Number(it.cost ?? 0);
          const qty = Number(it.quantity ?? 0);
          const amount = qty * cost;
          return {
            slNo: idx + 1,
            item: product?.name ?? variant?.sku ?? "—",
            quantity: qty,
            unit: "Pcs",
            rate: cost,
            amount,
            vatPercent: undefined,
            vatAmount: undefined,
            total: amount,
          };
        });
        setInvoice({
          invoiceNo: p.id?.slice(0, 8) ?? id,
          invoiceDate: p.createdAt ? new Date(p.createdAt).toLocaleString() : "—",
          supplier: supplier?.name ?? "—",
          supplierAddress: supplier?.address ?? undefined,
          supplierPhone: supplier?.phone ?? undefined,
          items,
          grandTotal: Number(p.totalAmount ?? 0),
          subtotal: Number(p.totalAmount ?? 0),
          taxAmount: 0,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error || !invoice) return <div className="p-6 text-red-600">{error ?? "Not found"}</div>;

  return (
    <div className="p-6">
      <div className="no-print mb-4">
        <Link href="/purchase/invoices" className="text-sm text-blue-600 hover:underline">
          ← Back to list
        </Link>
      </div>
      <PurchaseInvoiceView invoice={invoice} />
    </div>
  );
}
