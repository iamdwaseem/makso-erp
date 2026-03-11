import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { WarehouseSelector } from "./WarehouseSelector";

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "📊 Dashboard", path: "/" },
    { name: "📥 Stock Entry", path: "/stock-entry" },
    { name: "📤 Stock Exit", path: "/stock-exit" },
    { name: "📦 Inventory", path: "/inventory" },
    { name: "📋 History", path: "/history" },
    ...(user?.role === "ADMIN" ? [
      { name: "👥 Users", path: "/users" },
      { name: "🏢 Warehouses", path: "/warehouses" }
    ] : []),
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden text-gray-900 w-full">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col fixed lg:static z-40 h-full transition-transform duration-200 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
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
                    onClick={() => setMobileMenuOpen(false)}
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

        {/* User info + logout at the bottom of sidebar */}
        {user && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <button
                id="logout-btn"
                onClick={logout}
                title="Sign out"
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Component */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="min-h-16 bg-white border-b border-gray-200 flex items-center px-3 sm:px-4 lg:px-8 py-2 shadow-sm justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
                aria-label="Open menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 truncate">
              {navItems.find(i => i.path === location.pathname)?.name || "Not Found"}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <WarehouseSelector />
            </div>
        </header>

        <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
