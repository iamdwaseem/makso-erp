"use client";

export default function PaymentReportPage() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">PAYMENT REPORT</h1>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Date range" className="rounded border border-gray-200 px-3 py-1.5 text-sm" />
          <select className="rounded border border-gray-200 px-3 py-1.5 text-sm">
            <option>All Suppliers</option>
          </select>
          <button type="button" className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white">Generate</button>
          <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">Export</button>
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase text-gray-700">Payment Details</h3>
          <p className="text-sm text-gray-500">Date, Bill No, Bill Date, Bill Value, Supplier Name, Cash Account, Payment Voucher, Cheque, Adjustments, Total Collection.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase text-gray-700">Collected PDC &amp; Open Cheques</h3>
          <p className="text-sm text-gray-500">Issued Date, Cheque Date, Supplier, Payment Voucher, Cheque No., PDC, Open, Status.</p>
        </div>
      </div>
    </>
  );
}
