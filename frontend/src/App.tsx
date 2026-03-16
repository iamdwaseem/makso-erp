import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequireRole } from "./components/RequireRole";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ScanStation } from "./pages/ScanStation";
import { Inventory } from "./pages/Inventory";
import { InventoryDashboard } from "./pages/InventoryDashboard";
import { GoodsReceiptNotesPage } from "./pages/inventory/GoodsReceiptNotesPage";
import { ReceiptNoteDetailPage } from "./pages/inventory/ReceiptNoteDetailPage";
import { InventoryAdjustmentPage } from "./pages/inventory/InventoryAdjustmentPage";
import { InventorySettingsPage } from "./pages/inventory/InventorySettingsPage";
import { CategoriesSettingsPage } from "./pages/inventory/settings/CategoriesSettingsPage";
import { UnitsSettingsPage } from "./pages/inventory/settings/UnitsSettingsPage";
import { BrandsSettingsPage } from "./pages/inventory/settings/BrandsSettingsPage";
import { VariantsSettingsPage } from "./pages/inventory/settings/VariantsSettingsPage";
import { StockReportPage } from "./pages/inventory/reports/StockReportPage";
import { InventorySummaryReportPage } from "./pages/inventory/reports/InventorySummaryReportPage";
import { ItemTransactionsReportPage } from "./pages/inventory/reports/ItemTransactionsReportPage";
import { LowStockReportPage } from "./pages/inventory/reports/LowStockReportPage";
import { InventoryTransferPlaceholder } from "./pages/inventory/InventoryTransferPlaceholder";
import { History } from "./pages/History";
import { UserManagement } from "./pages/UserManagement";
import { WarehouseManagement } from "./pages/WarehouseManagement";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
            <Route path="inventory/transfers" element={<InventoryTransferPlaceholder />} />
            <Route path="inventory/adjustment" element={<InventoryAdjustmentPage />} />
            <Route path="inventory/reports/stock" element={<StockReportPage />} />
            <Route path="inventory/reports/summary" element={<InventorySummaryReportPage />} />
            <Route path="inventory/reports/item-transactions" element={<ItemTransactionsReportPage />} />
            <Route path="inventory/reports/low-stock" element={<LowStockReportPage />} />
            <Route path="inventory/settings" element={<RequireRole roles={["MANAGER", "ADMIN"]}><InventorySettingsPage /></RequireRole>} />
            <Route path="inventory/settings/categories" element={<RequireRole roles={["MANAGER", "ADMIN"]}><CategoriesSettingsPage /></RequireRole>} />
            <Route path="inventory/settings/units" element={<RequireRole roles={["MANAGER", "ADMIN"]}><UnitsSettingsPage /></RequireRole>} />
            <Route path="inventory/settings/brands" element={<RequireRole roles={["MANAGER", "ADMIN"]}><BrandsSettingsPage /></RequireRole>} />
            <Route path="inventory/settings/variants" element={<RequireRole roles={["MANAGER", "ADMIN"]}><VariantsSettingsPage /></RequireRole>} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}
