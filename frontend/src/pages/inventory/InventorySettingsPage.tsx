import { Link } from "react-router-dom";

const settings = [
  { href: "/inventory/settings/categories", name: "Categories", desc: "Classify similar items together (item groups). Create and view groups." },
  { href: "/inventory/settings/units", name: "Units", desc: "Create units of measurement (name, short form, decimal places, base unit)." },
  { href: "/inventory/settings/brands", name: "Brands", desc: "Create and view brands for products." },
  { href: "/inventory/settings/variants", name: "Variants", desc: "View and manage product variants (SKU, color, etc.)." },
];

export function InventorySettingsPage() {
  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">INVENTORY SETTINGS</h1>
      <p className="mb-6 text-sm text-gray-500">
        Configure item groups (categories), units, brands, and variants.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settings.map(({ href, name, desc }) => (
          <Link
            key={href}
            to={href}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:border-blue-200 hover:shadow-md"
          >
            <h2 className="font-semibold text-gray-900">{name}</h2>
            <p className="mt-2 text-sm text-gray-500">{desc}</p>
            <span className="mt-3 inline-block text-sm font-medium text-blue-600">Configure →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
