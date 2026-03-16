"use client";

export default function BatchesPage() {
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">BATCHES</h1>
        <button type="button" className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
        Inventory batches — quantity of items received on a specified date for a specified cost.
      </div>
    </div>
  );
}
