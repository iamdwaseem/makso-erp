"use client";

export default function ItemEnquiryReportPage() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">ITEM ENQUIRY</h1>
        <span className="text-gray-600">MODERNA SOFA</span>
        <button type="button" className="rounded border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm">Customer</button>
        <button type="button" className="rounded border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm">Supplier</button>
        <button type="button" className="ml-auto rounded bg-blue-600 px-3 py-1.5 text-sm text-white">Generate</button>
      </div>
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase text-gray-700">Item Enquiry As on Sep 29, 2021</h3>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><span className="text-gray-500">Item Name:</span> <span className="font-medium">MODERNA SOFA</span></div>
            <div><span className="text-gray-500">Item Code:</span> <span className="font-medium">2445</span></div>
            <div><span className="text-gray-500">Base Unit:</span> <span className="font-medium">NO</span></div>
            <div><span className="text-gray-500">Cost Price:</span> <span className="font-medium">6500</span></div>
            <div><span className="text-gray-500">Item Stock:</span> <span className="font-medium">10</span></div>
            <div><span className="text-gray-500">Item Id:</span> <span className="font-medium">81</span></div>
            <div><span className="text-gray-500">Item Type:</span> <span className="font-medium">stock in trade</span></div>
            <div><span className="text-gray-500">Avg Unit Value:</span> <span className="font-medium">6,600.00</span></div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase text-gray-700">Recent Purchases</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Supplier</th>
                <th className="px-3 py-2">Invoice No</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Qty Unit</th>
                <th className="px-3 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-3 py-2">Sep 29, 2021</td>
                <td className="px-3 py-2">Tip Top Furniture</td>
                <td className="px-3 py-2">P1139 [mnk534]</td>
                <td className="px-3 py-2">6,500.00</td>
                <td className="px-3 py-2">10 NO</td>
                <td className="px-3 py-2">65,000.00</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase text-gray-700">Recent Sales</h3>
          <p className="text-sm text-gray-500">No data</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase text-gray-700">Inventory Summary</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-3 py-2">Center</th>
                <th className="px-3 py-2">Net</th>
                <th className="px-3 py-2">WIP</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-3 py-2">Tirur</td>
                <td className="px-3 py-2">10</td>
                <td className="px-3 py-2">0</td>
                <td className="px-3 py-2">10</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
