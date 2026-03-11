import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();

describe("API smoke suite", () => {
  let token = "";
  let warehouseId = "";
  let supplierId = "";
  let customerId = "";
  let variantId = "";

  beforeAll(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it("passes critical happy-path flow", async () => {
    const register = await request(app).post("/api/auth/register").send({
      name: "Smoke Tester",
      email: "smoke@wareflow.io",
      password: "SmokePass@123",
    });
    expect([201, 409]).toContain(register.status);

    const login = await request(app).post("/api/auth/login").send({
      email: "smoke@wareflow.io",
      password: "SmokePass@123",
    });
    expect(login.status).toBe(200);
    token = login.body.token;

    const warehouse = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Smoke WH", code: "SMK-01", location: "HQ" });
    expect(warehouse.status).toBe(201);
    warehouseId = warehouse.body.id;

    const supplier = await request(app)
      .post("/api/suppliers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Smoke Supplier", phone: "5551001000" });
    expect(supplier.status).toBe(201);
    supplierId = supplier.body.id;

    const customer = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Smoke Customer", phone: "5552002000" });
    expect(customer.status).toBe(201);
    customerId = customer.body.id;

    const product = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Smoke Product" });
    expect(product.status).toBe(201);

    const variant = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ product_id: product.body.id, color: "Black" });
    expect(variant.status).toBe(201);
    variantId = variant.body.id;

    const purchase = await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({ supplier_id: supplierId, warehouse_id: warehouseId, items: [{ variant_id: variantId, quantity: 12 }] });
    expect(purchase.status).toBe(201);

    const sale = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({ customer_id: customerId, warehouse_id: warehouseId, items: [{ variant_id: variantId, quantity: 4 }] });
    expect(sale.status).toBe(201);

    const dashboard = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(dashboard.status).toBe(200);

    const history = await request(app)
      .get("/api/history")
      .query({ page: 1, limit: 10 })
      .set("Authorization", `Bearer ${token}`);
    expect(history.status).toBe(200);
  }, 20000);
});

