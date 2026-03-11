import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequireRole } from "./components/RequireRole";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { StockEntry } from "./pages/StockEntry";
import { ScanStation } from "./pages/ScanStation";
import { Inventory } from "./pages/Inventory";
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
            <Route path="stock-entry" element={<StockEntry />} />
            <Route path="stock-exit" element={<ScanStation />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="history" element={<History />} />
            <Route
              path="users"
              element={
                <RequireRole roles={["ADMIN"]}>
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
