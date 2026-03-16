"use client";

type PurchaseInvoiceFiltersProps = {
  dateRange: string;
  onDateRangeChange: (v: string) => void;
  supplier: string;
  onSupplierChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  invoiceNo: string;
  onInvoiceNoChange: (v: string) => void;
};

export default function PurchaseInvoiceFilters({
  dateRange,
  onDateRangeChange,
  supplier,
  onSupplierChange,
  status,
  onStatusChange,
  invoiceNo,
  onInvoiceNoChange,
}: PurchaseInvoiceFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input type="text" value={invoiceNo} onChange={(e) => onInvoiceNoChange(e.target.value)} placeholder="Invoice Number" className="rounded border border-gray-200 px-3 py-1.5 text-sm" />
      <input type="text" value={dateRange} onChange={(e) => onDateRangeChange(e.target.value)} placeholder="Date Range" className="rounded border border-gray-200 px-3 py-1.5 text-sm" />
      <input type="text" value={supplier} onChange={(e) => onSupplierChange(e.target.value)} placeholder="Supplier" className="rounded border border-gray-200 px-3 py-1.5 text-sm" />
      <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm">
        <option value="all">All</option>
        <option value="Open">Open</option>
        <option value="Partially Paid">Partially Paid</option>
        <option value="Paid">Paid</option>
        <option value="Cancelled">Cancelled</option>
        <option value="Approved">Approved</option>
        <option value="Closed">Closed</option>
      </select>
    </div>
  );
}
