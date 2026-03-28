import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();
let token = "";
let supplierId = "";
let customerId = "";
let variantId = "";
let warehouseId = "";

describe("History period and custom date filters", () => {
  beforeAll(async () => {
    await cleanDb();
    await request(app).post("/api/auth/register").send({
      name: "History Tester",
      email: "history-test@wareflow.io",
      password: "HistoryPass@123",
    });
    const login = await request(app).post("/api/auth/login").send({
      email: "history-test@wareflow.io",
      password: "HistoryPass@123",
    });
    token = login.body.token;

    const warehouse = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "History WH", code: "HIS-01", location: "HQ" });
    warehouseId = warehouse.body.id;

    const supplier = await request(app)
      .post("/api/suppliers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "History Supplier", phone: "5550001111" });
    supplierId = supplier.body.id;

    const customer = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "History Customer", phone: "5550002222" });
    customerId = customer.body.id;

    const product = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "History Product" });
    const variant = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ product_id: product.body.id, color: "Blue" });
    variantId = variant.body.id;

    const purchase = await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({ supplier_id: supplierId, warehouse_id: warehouseId, items: [{ variant_id: variantId, quantity: 10 }] });
    expect(purchase.status).toBe(201);

    const sale = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({ customer_id: customerId, warehouse_id: warehouseId, items: [{ variant_id: variantId, quantity: 2 }] });
    expect(sale.status).toBe(201);

  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it("period=day returns only recent activity", async () => {
    const res = await request(app)
      .get("/api/history")
      .query({ page: 1, limit: 50, period: "day" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it("period=year includes at least today's records", async () => {
    const dayRes = await request(app)
      .get("/api/history")
      .query({ page: 1, limit: 50, period: "day" })
      .set("Authorization", `Bearer ${token}`);
    const yearRes = await request(app)
      .get("/api/history")
      .query({ page: 1, limit: 50, period: "year" })
      .set("Authorization", `Bearer ${token}`);
    expect(yearRes.status).toBe(200);
    expect(yearRes.body.meta.total).toBeGreaterThanOrEqual(dayRes.body.meta.total);
  });

  it("period=custom respects date window", async () => {
    const fmtLocal = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const end = new Date();

    const emptyRange = await request(app)
      .get("/api/history")
      .query({ page: 1, limit: 50, period: "custom", startDate: "2099-01-01", endDate: "2099-01-01" })
      .set("Authorization", `Bearer ${token}`);
    expect(emptyRange.status).toBe(200);
    expect(emptyRange.body.meta.total).toBe(0);

    const recentOnly = await request(app)
      .get("/api/history")
      .query({ page: 1, limit: 50, period: "custom", startDate: fmtLocal(start), endDate: fmtLocal(end) })
      .set("Authorization", `Bearer ${token}`);
    expect(recentOnly.status).toBe(200);
    expect(recentOnly.body.meta.total).toBeGreaterThanOrEqual(1);
  });
});

