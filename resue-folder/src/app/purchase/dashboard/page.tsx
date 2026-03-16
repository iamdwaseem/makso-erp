"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import MetricCard from "@/components/purchase/dashboard/MetricCard";
import PurchaseGraph from "@/components/purchase/dashboard/PurchaseGraph";
import ItemPurchaseGraph from "@/components/purchase/dashboard/ItemPurchaseGraph";
import TopSuppliers from "@/components/purchase/dashboard/TopSuppliers";
import ItemGroupPurchase from "@/components/purchase/dashboard/ItemGroupPurchase";
import EmployeePurchase from "@/components/purchase/dashboard/EmployeePurchase";
import PurchaseFilters from "@/components/purchase/dashboard/PurchaseFilters";
import { api } from "@/lib/api";

function getDateRange(fromDaysAgo: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - fromDaysAgo);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function PurchaseDashboardPage() {
  const [dateRange, setDateRange] = useState("lastMonths");
  const [supplier, setSupplier] = useState("all");
  const [chartTimeFilter, setChartTimeFilter] = useState("lastMonths");
  const [itemChartTimeFilter, setItemChartTimeFilter] = useState("thisYear");
  const [monthlyPurchases, setMonthlyPurchases] = useState<{ month: string; value: number }[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<{ name: string; amount: number; count: number }[]>([]);
  const [openDraft, setOpenDraft] = useState<number>(0);
  const [openSubmitted, setOpenSubmitted] = useState<number>(0);
  const [itemGroups, setItemGroups] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { from, to } = getDateRange(90);
    try {
      const [trendRes, purchasesRes, groupsRes] = await Promise.all([
        api.getSalesPurchaseTrend(from, to).catch(() => []),
        api.getPurchases({ page: 1, limit: 500 }).catch(() => ({ data: [], meta: {} })),
        api.getInventoryItemGroups().catch(() => []),
      ]);
      const trend = Array.isArray(trendRes) ? trendRes : [];
      setMonthlyPurchases(trend.map((p: any) => ({ month: p.period ?? "", value: Number(p.purchases ?? 0) })));
      const list = (purchasesRes as any).data ?? [];
      let draft = 0, submitted = 0;
      const bySupplier: Record<string, { amount: number; count: number }> = {};
      list.forEach((p: any) => {
        if (p.status === "DRAFT") draft++;
        else if (p.status === "SUBMITTED") submitted++;
        const name = (typeof p.supplier === "object" && p.supplier?.name) ? p.supplier.name : (p.supplierId ?? "—");
        const amt = Number(p.grandTotal ?? p.total ?? 0);
        if (!bySupplier[name]) bySupplier[name] = { amount: 0, count: 0 };
        bySupplier[name].amount += amt;
        bySupplier[name].count += 1;
      });
      setOpenDraft(draft);
      setOpenSubmitted(submitted);
      setTopSuppliers(
        Object.entries(bySupplier)
          .map(([name, v]) => ({ name, amount: v.amount, count: v.count }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10)
      );
      setItemGroups(Array.isArray(groupsRes) ? groupsRes : []);
    } catch {
      setMonthlyPurchases([]);
      setTopSuppliers([]);
      setItemGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const supplierOptions = useMemo(
    () => [
      { value: "all", label: "All Suppliers" },
      ...topSuppliers.map((s) => ({ value: s.name, label: s.name })),
    ],
    [topSuppliers]
  );

  const monthTotal = useMemo(() => {
    if (monthlyPurchases.length === 0) return "0.00 AED";
    const last = monthlyPurchases[monthlyPurchases.length - 1];
    return (last?.value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 }) + " AED";
  }, [monthlyPurchases]);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
        PURCHASE DASHBOARD
      </h1>

      <div className="mb-6">
        <PurchaseFilters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          supplier={supplier}
          onSupplierChange={setSupplier}
          supplierOptions={supplierOptions}
        />
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div>
      ) : (
        <>
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <MetricCard value="—" title="Open Quotations" onNew={() => {}} onList={() => {}} />
            <MetricCard value={String(openDraft)} title="Open Orders (Draft)" onNew={() => {}} onList={() => {}} />
            <MetricCard value={String(openSubmitted)} title="Open Invoices" onNew={() => {}} onList={() => {}} />
            <MetricCard value={monthTotal} title="Month Purchase" />
            <MetricCard value="—" title="Month Inventory Purchase" />
            <MetricCard value="—" title="Month Asset Purchase" />
            <MetricCard value="—" title="Month Service Purchase" />
          </section>

          <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PurchaseGraph
                data={monthlyPurchases}
                title="PURCHASE"
                timeFilter={chartTimeFilter}
                onTimeFilterChange={setChartTimeFilter}
              />
            </div>
            <div>
              <TopSuppliers data={topSuppliers} />
            </div>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ItemPurchaseGraph
              data={[]}
              title="ITEM WISE PURCHASE"
              timeFilter={itemChartTimeFilter}
              onTimeFilterChange={setItemChartTimeFilter}
            />
            <EmployeePurchase data={[]} title="EMPLOYEE WISE PURCHASE" />
          </section>

          <section>
            <ItemGroupPurchase data={itemGroups} />
          </section>
        </>
      )}
    </div>
  );
}
