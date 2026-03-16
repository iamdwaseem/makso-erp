import { Link } from "react-router-dom";

export function MaterialRequestPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">MATERIAL REQUEST</h1>
      <p className="mb-6 text-sm text-gray-500">Request materials for purchase, transfer, or production. This section can be implemented with a list and form (date, purpose, for center, items).</p>
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Material Request is not yet implemented.</p>
        <p className="mt-2 text-sm text-gray-500">You can use Purchase (Goods Receipt) or Inventory Transfer when those are available.</p>
      </div>
    </div>
  );
}
