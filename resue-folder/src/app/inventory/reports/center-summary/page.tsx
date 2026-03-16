"use client";

export default function CenterSummaryReportPage() {
  const stockRows = [
    { itemCode: "BR012", itemName: "Sandwich Bread pCK25", unit: "Nos", opening: 10, in: 0, out: 0, closing: 10 },
    { itemCode: "1100114", itemName: "ENZO L SOFA", unit: "NO", opening: 17, in: 0, out: 0, closing: 17 },
    { itemCode: "2445", itemName: "MODERNA SOFA", unit: "NO", opening: 0, in: 10, out: 0, closing: 10 },
  ];
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">CENTER SUMMARY Tirur</h1>
        <span className="text-sm text-gray-600">29-09-2021 - 29-09-2021</span>
        <button type="button" className="ml-auto rounded bg-blue-600 px-3 py-1.5 text-sm text-white">Generate</button>
        <button type="button" className="rounded border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm">Export</button>
      </div>
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase text-gray-700">Center Summary As on Sep 29, 2021</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
            <div><span className="text-gray-500">From:</span> Sep 29, 2021</div>
            <div><span className="text-gray-500">To:</span> Sep 29, 2021</div>
            <div><span className="text-gray-500">Salesman:</span> Riza Asif</div>
            <div><span className="text-gray-500">Center:</span> Tirur</div>
            <div><span className="text-gray-500">Opening Cash:</span> 2208652</div>
            <div><span className="text-gray-500">Closing Cash:</span> 2208652</div>
            <div><span className="text-gray-500">Credit Sales Amount:</span> 0.00</div>
            <div><span className="text-gray-500">No. of Sales:</span> 0</div>
            <div><span className="text-gray-500">Cash Sales Amount:</span> 0.00</div>
            <div><span className="text-gray-500">Total Sales Amount:</span> 0.00</div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white">
          <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold uppercase text-gray-700">STOCK SUMMARY</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Item Code</th>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Opening</th>
                <th className="px-4 py-3">In</th>
                <th className="px-4 py-3">Out</th>
                <th className="px-4 py-3">Closing</th>
              </tr>
            </thead>
            <tbody>
              {stockRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-4 py-3">{row.itemCode}</td>
                  <td className="px-4 py-3">{row.itemName}</td>
                  <td className="px-4 py-3">{row.unit}</td>
                  <td className="px-4 py-3 tabular-nums">{row.opening}</td>
                  <td className="px-4 py-3 tabular-nums">{row.in}</td>
                  <td className="px-4 py-3 tabular-nums">{row.out}</td>
                  <td className="px-4 py-3 tabular-nums">{row.closing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
