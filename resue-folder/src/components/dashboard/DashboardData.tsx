"use client";

import { useEffect, useState } from "react";
import { SHOW_SALES_PURCHASE } from "@/config/features";
import StatCard from "@/components/dashboard/StatCard";
import FinanceCard from "@/components/dashboard/FinanceCard";
import LineChart from "@/components/dashboard/LineChart";
import BarChart from "@/components/dashboard/BarChart";
import ExpensePieChart from "@/components/dashboard/PieChart";
import CashBankTable from "@/components/dashboard/CashBankTable";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import { api, type DashboardStats, type SalesPurchaseTrendPoint } from "@/lib/api";

const CURRENCY = "AED";
const formatMoney = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + CURRENCY;

/** Map API period "2025-01" to chart label "Jan '25" */
function periodToMonthLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return period;
  const shortYear = String(y).slice(-2);
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec";
  const name = months.split(" ")[m - 1] || "";
  return `${name} '${shortYear}`;
}

const emptySalePurchaseData: { month: string; sale: number; purchase: number }[] = [];
const emptyIncomeExpenseData: { month: string; income: number; expense: number }[] = [];
const emptyExpensePieData: { name: string; value: number; color?: string }[] = [];
const emptyCashBankRows: { accountName: string; amount: string }[] = [];

export default function DashboardData() {
  const { dateFrom, dateTo } = useGlobalFilter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<SalesPurchaseTrendPoint[]>([]);
  const [itemGroups, setItemGroups] = useState<{ name: string; value: number; color?: string }[]>([]);
  const [inventoryTrend, setInventoryTrend] = useState<{ period: string; value: number }[]>([]);
  const [stockInOutTrend, setStockInOutTrend] = useState<{ period: string; stockIn: number; stockOut: number }[]>([]);
  const [employeeSales, setEmployeeSales] = useState<{ employee: string; count: number; revenue: number }[]>([]);
  const [gainLoss, setGainLoss] = useState<{ gain: number; loss: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fromStr = dateFrom || (() => {
      const from = new Date();
      from.setMonth(from.getMonth() - 12);
      return from.toISOString().slice(0, 10);
    })();
    const toStr = dateTo || new Date().toISOString().slice(0, 10);

    Promise.all([
      api.getDashboardStats({ from: fromStr, to: toStr }).catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load stats");
        return null;
      }),
      api.getSalesPurchaseTrend(fromStr, toStr).catch(() => null),
      api.getStockInOutTrend(fromStr, toStr).catch(() => null),
      api.getInventoryItemGroups().catch(() => null),
      api.getInventoryTrend(fromStr, toStr).catch(() => null),
      api.getEmployeeSales({ from: fromStr, to: toStr }).catch(() => null),
      api.getInventoryGainLoss().catch(() => null),
    ]).then(([s, t, siot, g, invTrend, empSales, gl]) => {
      if (cancelled) return;
      if (s) setStats(s);
      if (t && t.length) setTrend(t);
      if (siot && Array.isArray(siot) && siot.length) setStockInOutTrend(siot);
      if (g && g.length) {
        const colors = ["#7dd3fc", "#dc2626", "#0d9488", "#9ca3af", "#f97316", "#a78bfa"];
        setItemGroups(g.map((x, i) => ({ ...x, color: colors[i % colors.length] })));
      }
      if (invTrend && Array.isArray(invTrend) && invTrend.length) setInventoryTrend(invTrend);
      if (empSales && Array.isArray(empSales) && empSales.length) setEmployeeSales(empSales);
      if (gl && typeof gl === "object") setGainLoss(gl);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo]);

  if (loading && !stats && !error) {
    return (
      <div className="p-6">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-500">Loading dashboard from API...</p>
      </div>
    );
  }

  const s = stats || {
    totalSales: 0,
    cashSales: 0,
    creditSales: 0,
    creditNotesCount: 0,
    openSaleInvoices: 0,
    openPurchaseInvoices: 0,
    collection: 0,
    expenseClaims: 0,
    lowStockItems: 0,
  };

  const kpiCards = SHOW_SALES_PURCHASE
    ? [
        { value: formatMoney(s.totalSales), label: "TOTAL SALES", variant: "dark" as const },
        { value: formatMoney(s.cashSales), label: "CASH SALES", variant: "green" as const },
        { value: formatMoney(s.creditSales), label: "CREDIT SALES", variant: "yellow" as const },
        { value: String(s.creditNotesCount) + " CREDIT NOTES", label: "CREDIT NOTES", variant: "red" as const },
        { value: String(s.openSaleInvoices) + " OPEN SALE INVOICES", label: "OPEN SALE INVOICES", variant: "red" as const },
        { value: String(s.expenseClaims) + " EXPENSE CLAIMS", label: "EXPENSE CLAIMS", variant: "white" as const },
        { value: formatMoney(s.collection), label: "TOTAL COLLECTION", variant: "white" as const },
      ]
    : [];

  const salePurchaseData =
    trend.length > 0
      ? trend.map((p) => ({
          month: periodToMonthLabel(p.period),
          sale: p.sales,
          purchase: p.purchases,
        }))
      : emptySalePurchaseData;

  const stockInOutChartData =
    stockInOutTrend.length > 0
      ? stockInOutTrend.map((p) => ({
          month: periodToMonthLabel(p.period),
          sale: p.stockIn,
          purchase: p.stockOut,
        }))
      : emptySalePurchaseData;

  const financeCards = [
    { title: "OPEN SALE INVOICES", value: String(s.openSaleInvoices), variant: "dark" as const, actions: [{ label: "+ NEW", type: "new" as const }, { label: "LIST", type: "list" as const }] },
    { title: "OPEN PURCHASE INVOICES", value: String(s.openPurchaseInvoices), variant: "dark" as const, actions: [{ label: "+ NEW", type: "new" as const }, { label: "LIST", type: "list" as const }] },
    { title: "TRADE RECEIVABLES", value: formatMoney(s.creditSales), variant: "green" as const },
    { title: "MONTH SALES", value: formatMoney(s.totalSales), variant: "gray" as const },
    { title: "MONTH PURCHASE", value: "—", variant: "white" as const },
    { title: "TRADE PAYABLES", value: "—", variant: "yellow" as const },
  ];

  const expensePieData = itemGroups.length > 0 ? itemGroups : emptyExpensePieData;

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {error} — Using default values. Ensure backend is running, NEXT_PUBLIC_API_URL is set, and NEXT_PUBLIC_ORGANIZATION_SLUG matches your org (e.g. acme-erp for MAKSO demo).
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">DASHBOARD</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">All Employees</span>
          <select className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
            <option>All</option>
          </select>
          <select className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
            <option>Last 12 months</option>
            <option>This month</option>
            <option>Last month</option>
            <option>This year</option>
          </select>
        </div>
      </div>

      {kpiCards.length > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {kpiCards.map((card) => (
              <StatCard key={card.label} value={card.value} label={card.label} variant={card.variant} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LineChart
          data={stockInOutChartData}
          title="STOCK IN AND STOCK OUT"
          nameFirst="Stock In"
          nameSecond="Stock Out"
          valueSuffix=""
        />
        {SHOW_SALES_PURCHASE && (
          <>
            <LineChart data={salePurchaseData} title="SALE AND PURCHASE" />
            <BarChart data={emptyIncomeExpenseData} title="INCOME AND EXPENSE" />
          </>
        )}
      </section>

      {SHOW_SALES_PURCHASE && (
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {financeCards.map((card) => (
              <FinanceCard
                key={card.title}
                title={card.title}
                value={card.value}
                variant={card.variant}
                actions={card.actions}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ExpensePieChart data={expensePieData} title="INVENTORY BY PRODUCT" />
        {inventoryTrend.length > 0 && (
          <LineChart
            data={inventoryTrend.map((p) => ({ month: periodToMonthLabel(p.period), sale: p.value, purchase: 0 }))}
            title="INVENTORY TREND"
          />
        )}
        {gainLoss != null && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold uppercase text-gray-700">INVENTORY GAIN / LOSS</h3>
            <p className="text-lg font-medium text-green-600">Gain: {formatMoney(gainLoss.gain)}</p>
            <p className="text-lg font-medium text-red-600">Loss: {formatMoney(gainLoss.loss)}</p>
          </div>
        )}
      </section>
      {SHOW_SALES_PURCHASE && employeeSales.length > 0 && (
        <section className="mb-8">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold uppercase text-gray-700">EMPLOYEE SALES</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="py-2 pr-4">Employee</th>
                    <th className="py-2 text-right">Count</th>
                    <th className="py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeSales.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 pr-4">{row.employee}</td>
                      <td className="py-2 text-right">{row.count}</td>
                      <td className="py-2 text-right">{formatMoney(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CashBankTable rows={emptyCashBankRows} total="—" title="CASH / CASH EQUIVALENTS" />
      </section>
    </div>
  );
}
