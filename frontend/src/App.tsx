import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { StockEntry } from "./pages/StockEntry";
import { ScanStation } from "./pages/ScanStation";
import { Inventory } from "./pages/Inventory";
import { History } from "./pages/History";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="stock-entry" element={<StockEntry />} />
          <Route path="stock-exit" element={<ScanStation />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="history" element={<History />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
