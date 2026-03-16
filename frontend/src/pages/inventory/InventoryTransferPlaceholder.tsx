import { Link } from "react-router-dom";

export function InventoryTransferPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">INVENTORY TRANSFER</h1>
      <p className="mb-6 text-sm text-gray-500">Move stock between warehouses. This section can be implemented with a list and form (source warehouse, destination warehouse, items).</p>
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Inventory Transfer is not yet implemented.</p>
        <p className="mt-2 text-sm text-gray-500">Use Goods Receipt Note for inbound and Goods Delivery Note for outbound in the meantime.</p>
      </div>
    </div>
  );
}
