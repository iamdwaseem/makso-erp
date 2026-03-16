import { useLocation } from "react-router-dom";

const TITLES: Record<string, string> = {
  "delivery-notes": "Delivery Notes",
  "material-requests": "Material Request",
  "transfers": "Inventory Transfer",
  "adjustment": "Inventory Adjustment",
  "revaluation": "Inventory Revaluation",
  "conversion": "Inventory Conversion",
  "batches": "Batches",
  "serial-status": "Serial No. Status Update",
  "reports": "Reports",
  "stock": "Reports",
  "settings": "Settings",
};

export function InventoryPlaceholder() {
  const { pathname } = useLocation();
  const segment = pathname.replace(/^\/inventory\/?/, "").split("/")[0] || "";
  const displayTitle = TITLES[segment] ?? "Inventory";

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">{displayTitle}</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-gray-500">This section is not yet implemented.</p>
        <p className="mt-2 text-sm text-gray-400">You can use Inventory Dashboard, Items, Goods Receipt Note, and Goods Delivery Note in the meantime.</p>
      </div>
    </div>
  );
}
