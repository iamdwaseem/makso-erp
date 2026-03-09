import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import supplierRoutes from "./routes/supplier.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import variantRoutes from "./routes/variant.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import scanRoutes from "./routes/scan.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware — cors MUST come before helmet
app.use(cors({ origin: "*" }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api", supplierRoutes);
app.use("/api", customerRoutes);
app.use("/api", productRoutes);
app.use("/api", variantRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", purchaseRoutes);
app.use("/api", saleRoutes);
app.use("/api", scanRoutes);
app.use("/api", dashboardRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Use http.createServer to keep process alive (Express 5 app.listen returns a Promise)
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`[server]: Warehouse ERP backend is running at http://localhost:${PORT}`);
});
