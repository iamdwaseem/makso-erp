import { Link } from "react-router-dom";
import { Package, Layers, FolderTree, Tag } from "lucide-react";

const links = [
  { to: "/inventory/items/products", label: "Products", desc: "Product master and variants", icon: Package },
  { to: "/inventory/items/variants", label: "Variants", desc: "Stock by variant (inventory list)", icon: Layers },
  { to: "/inventory/items/categories", label: "Categories", desc: "Item groups / categories", icon: FolderTree },
  { to: "/inventory/items/brands", label: "Brands", desc: "Product brands", icon: Tag },
];

export function ItemsIndexPage() {
  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">ITEMS</h1>
      <p className="mb-6 text-sm text-gray-500">Manage products, variants, categories, and brands.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {links.map(({ to, label, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{label}</h2>
              <p className="mt-1 text-sm text-gray-500">{desc}</p>
              <span className="mt-2 inline-block text-sm font-medium text-blue-600">Open →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
