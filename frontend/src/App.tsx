import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequireRole } from "./components/RequireRole";
import { Layout } from "./components/Layout";
import { PageLoader } from "./components/PageLoader";

const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const ScanStation = lazy(() => import("./pages/ScanStation").then((m) => ({ default: m.ScanStation })));
const Inventory = lazy(() => import("./pages/Inventory").then((m) => ({ default: m.Inventory })));
const InventoryDashboard = lazy(() =>
  import("./pages/InventoryDashboard").then((m) => ({ default: m.InventoryDashboard }))
);
const GoodsReceiptNotesPage = lazy(() =>
  import("./pages/inventory/GoodsReceiptNotesPage").then((m) => ({ default: m.GoodsReceiptNotesPage }))
);
const ReceiptNoteDetailPage = lazy(() =>
  import("./pages/inventory/ReceiptNoteDetailPage").then((m) => ({ default: m.ReceiptNoteDetailPage }))
);
const InventorySettingsPage = lazy(() =>
  import("./pages/inventory/InventorySettingsPage").then((m) => ({ default: m.InventorySettingsPage }))
);
const CategoriesSettingsPage = lazy(() =>
  import("./pages/inventory/settings/CategoriesSettingsPage").then((m) => ({
    default: m.CategoriesSettingsPage,
  }))
);
const UnitsSettingsPage = lazy(() =>
  import("./pages/inventory/settings/UnitsSettingsPage").then((m) => ({ default: m.UnitsSettingsPage }))
);
const BrandsSettingsPage = lazy(() =>
  import("./pages/inventory/settings/BrandsSettingsPage").then((m) => ({ default: m.BrandsSettingsPage }))
);
const VariantsSettingsPage = lazy(() =>
  import("./pages/inventory/settings/VariantsSettingsPage").then((m) => ({ default: m.VariantsSettingsPage }))
);
const StockReportPage = lazy(() =>
  import("./pages/inventory/reports/StockReportPage").then((m) => ({ default: m.StockReportPage }))
);
const InventorySummaryReportPage = lazy(() =>
  import("./pages/inventory/reports/InventorySummaryReportPage").then((m) => ({
    default: m.InventorySummaryReportPage,
  }))
);
const ItemTransactionsReportPage = lazy(() =>
  import("./pages/inventory/reports/ItemTransactionsReportPage").then((m) => ({
    default: m.ItemTransactionsReportPage,
  }))
);
const LowStockReportPage = lazy(() =>
  import("./pages/inventory/reports/LowStockReportPage").then((m) => ({ default: m.LowStockReportPage }))
);
const InventoryTransfersPage = lazy(() =>
  import("./pages/inventory/InventoryTransfersPage").then((m) => ({ default: m.InventoryTransfersPage }))
);
const InventoryTransferDetailPage = lazy(() =>
  import("./pages/inventory/InventoryTransferDetailPage").then((m) => ({
    default: m.InventoryTransferDetailPage,
  }))
);
const History = lazy(() => import("./pages/History").then((m) => ({ default: m.History })));
const UserManagement = lazy(() =>
  import("./pages/UserManagement").then((m) => ({ default: m.UserManagement }))
);
const WarehouseManagement = lazy(() =>
  import("./pages/WarehouseManagement").then((m) => ({ default: m.WarehouseManagement }))
);
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes wrapped in Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="inventory" element={<Navigate to="/inventory/dashboard" replace />} />
              <Route path="inventory/dashboard" element={<InventoryDashboard />} />
              <Route path="inventory/items" element={<Inventory />} />
              <Route path="inventory/receipt-notes" element={<GoodsReceiptNotesPage />} />
              <Route path="inventory/receipt-notes/:id" element={<ReceiptNoteDetailPage />} />
              <Route path="inventory/stock-exit" element={<ScanStation />} />
              <Route path="inventory/transfers" element={<InventoryTransfersPage />} />
              <Route path="inventory/transfers/:id" element={<InventoryTransferDetailPage />} />
              <Route path="inventory/adjustment" element={<Navigate to="/inventory/items" replace />} />
              <Route path="inventory/reports/stock" element={<StockReportPage />} />
              <Route path="inventory/reports/summary" element={<InventorySummaryReportPage />} />
              <Route path="inventory/reports/item-transactions" element={<ItemTransactionsReportPage />} />
              <Route path="inventory/reports/low-stock" element={<LowStockReportPage />} />
              <Route
                path="inventory/settings"
                element={
                  <RequireRole roles={["MANAGER", "ADMIN"]}>
                    <InventorySettingsPage />
                  </RequireRole>
                }
              />
              <Route
                path="inventory/settings/categories"
                element={
                  <RequireRole roles={["MANAGER", "ADMIN"]}>
                    <CategoriesSettingsPage />
                  </RequireRole>
                }
              />
              <Route
                path="inventory/settings/units"
                element={
                  <RequireRole roles={["MANAGER", "ADMIN"]}>
                    <UnitsSettingsPage />
                  </RequireRole>
                }
              />
              <Route
                path="inventory/settings/brands"
                element={
                  <RequireRole roles={["MANAGER", "ADMIN"]}>
                    <BrandsSettingsPage />
                  </RequireRole>
                }
              />
              <Route
                path="inventory/settings/variants"
                element={
                  <RequireRole roles={["MANAGER", "ADMIN"]}>
                    <VariantsSettingsPage />
                  </RequireRole>
                }
              />
              <Route path="inventory/stock-entry" element={<Navigate to="/inventory/receipt-notes" replace />} />
              <Route path="stock-entry" element={<Navigate to="/inventory/receipt-notes" replace />} />
              <Route path="stock-exit" element={<Navigate to="/inventory/stock-exit" replace />} />
              <Route path="history" element={<History />} />
              <Route
                path="users"
                element={
                  <RequireRole roles={["MANAGER", "ADMIN"]}>
                    <UserManagement />
                  </RequireRole>
                }
              />
              <Route
                path="warehouses"
                element={
                  <RequireRole roles={["ADMIN"]}>
                    <WarehouseManagement />
                  </RequireRole>
                }
              />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
