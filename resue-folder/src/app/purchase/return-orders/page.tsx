"use client";

import { useMemo, useState } from "react";
import ReturnOrderTable from "@/components/purchase/returns/ReturnOrderTable";
import ReturnOrderFilters from "@/components/purchase/returns/ReturnOrderFilters";
import { purchaseReturnOrdersMock } from "@/mock/purchaseReturnOrders";

export default function PurchaseReturnOrdersPage() {
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    if (status === "all") return purchaseReturnOrdersMock;
    return purchaseReturnOrdersMock.filter((o) => o.status === status);
  }, [status]);

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">PURCHASE RETURN ORDERS</h1>
          <ReturnOrderFilters status={status} onStatusChange={setStatus} />
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
          <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">EXPORT</button>
        </div>
      </div>
      <ReturnOrderTable orders={filtered} />
    </div>
  );
}
