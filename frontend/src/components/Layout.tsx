import { Link, Outlet, useLocation } from "react-router-dom";

export function Layout() {
  const location = useLocation();
  const navItems = [
    { name: "📊 Dashboard", path: "/" },
    { name: "📥 Stock Entry", path: "/stock-entry" },
    { name: "📤 Stock Exit", path: "/stock-exit" },
    { name: "📦 Inventory", path: "/inventory" },
    { name: "📋 History", path: "/history" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden text-gray-900 w-full">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold font-mono">WAREHOUSE ERP</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`block px-6 py-2.5 text-sm font-medium ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border-r-4 border-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content Component */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {navItems.find(i => i.path === location.pathname)?.name || "Not Found"}
            </h2>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
