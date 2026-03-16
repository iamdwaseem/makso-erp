"use client";

import Link from "next/link";

const settings = [
  { href: "/inventory/settings/item-groups", name: "Item Groups", desc: "Classify similar items together. Create and view groups." },
  { href: "/inventory/settings/units", name: "Units", desc: "Create units (name, short form, decimal places, base unit)." },
  { href: "/inventory/settings/brands", name: "Brands", desc: "Create and view brands for products." },
  { href: "/inventory/settings/variants", name: "Variants", desc: "Create variant options (e.g. Size, Color) for items." },
  { href: "/inventory/settings/item-unit-conversion", name: "Item Unit Conversion", desc: "Convert between units; specify multiplier." },
  { href: "/inventory/settings/opening-inventory", name: "Opening Inventory", desc: "Enter opening stock (item, center, qty, value)." },
  { href: "/inventory/settings/label-print", name: "Label Print", desc: "Create labels for products." },
  { href: "/inventory/settings/warehouse", name: "Aisle, Rack, Shelves & Bins", desc: "Warehouse racking: create aisles, racks, shelves, bins." },
];

export default function InventorySettingsPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">INVENTORY SETTINGS</h1>
      <p className="mb-6 text-sm text-gray-500">Configure item groups, units, brands, variants, and warehouse structure.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settings.map(({ href, name, desc }) => (
          <Link
            key={href}
            href={href}
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
