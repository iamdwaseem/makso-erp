"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PurchaseOrderView, { type PurchaseOrderDetailView } from "@/components/purchase/orders/PurchaseOrderView";
import { api } from "@/lib/api";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [order, setOrder] = useState<PurchaseOrderDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const p = await api.getPurchaseById(id);
      const supplierName = typeof (p as any).supplier === "object" && (p as any).supplier?.name
        ? (p as any).supplier.name
        : (p as any).supplierId ?? "—";
      const warehouseName = typeof (p as any).warehouse === "object" && (p as any).warehouse?.name
        ? (p as any).warehouse.name
        : "—";
      const items = ((p as any).items ?? []).map((it: any, i: number) => {
        const qty = Number(it.quantity ?? 0);
        const cost = Number(it.cost ?? it.unitCost ?? 0);
        const amount = qty * cost;
        const productName = it.variant?.product?.name ?? it.variant?.sku ?? it.variantId ?? "—";
        return {
          slNo: i + 1,
          item: productName,
          quantity: qty,
          unit: "PCS",
          price: cost,
          amount,
          vatPercent: 0,
          vatAmount: 0,
          total: amount,
        };
      });
      const totalInAed = Number((p as any).grandTotal ?? (p as any).total ?? 0) || items.reduce((s: number, i: { total: number }) => s + i.total, 0);
      setOrder({
        id: (p as any).id,
        number: (p as any).invoiceNumber ?? (p as any).id?.slice(0, 8) ?? "—",
        supplier: supplierName,
        contactPerson: "—",
        quotationId: null,
        quotationRef: null,
        date: (p as any).purchaseDate ? new Date((p as any).purchaseDate).toLocaleString() : ((p as any).createdAt ? new Date((p as any).createdAt).toLocaleString() : "—"),
        amount: totalInAed,
        status: (p as any).status ?? "DRAFT",
        inventoryCenter: warehouseName,
        employee: "—",
        items,
        totalInAed,
        balance: totalInAed,
        grandTotalWords: totalInAed >= 1000 ? "ONE THOUSAND AED ONLY" : `${totalInAed.toFixed(2)} AED ONLY`,
        receivedBy: undefined,
        paymentPaid: (p as any).status === "SUBMITTED",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!id) {
    return (
      <div className="p-6">
        <Link href="/purchase/orders" className="text-sm text-blue-600 hover:underline">← Back to list</Link>
        <p className="mt-4 text-gray-600">Invalid order ID.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Link href="/purchase/orders" className="text-sm text-blue-600 hover:underline">← Back to list</Link>
        <p className="mt-4 text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <Link href="/purchase/orders" className="text-sm text-blue-600 hover:underline">← Back to list</Link>
        <p className="mt-4 text-red-600">{error ?? "Order not found."}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/purchase/orders" className="text-sm text-blue-600 hover:underline">← Back to list</Link>
      </div>
      <PurchaseOrderView order={order} />
    </div>
  );
}
