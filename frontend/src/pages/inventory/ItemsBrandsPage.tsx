import { Link } from "react-router-dom";

export function ItemsBrandsPage() {
  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">BRANDS</h1>
      <p className="mb-6 text-sm text-gray-500">Product brands are configured in Inventory Settings.</p>
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Manage brands in Settings.</p>
        <Link
          to="/inventory/settings/brands"
          className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Open Settings → Brands
        </Link>
      </div>
    </div>
  );
}
