import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();

describe("Stock concurrency guard", () => {
  let token = "";
  let warehouseId = "";
  let supplierId = "";
  let customerId = "";
  let variantId = "";

  beforeAll(async () => {
    await cleanDb();
    await request(app).post("/api/auth/register").send({
      name: "Concurrency Admin",
      email: "concurrency@wareflow.io",
      password: "Concurrency@123",
    });
    const login = await request(app).post("/api/auth/login").send({
      email: "concurrency@wareflow.io",
      password: "Concurrency@123",
    });
    token = login.body.token;

    const wh = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Concurrency WH", code: "CON-01", location: "HQ" });
    expect(wh.status).toBe(201);
    warehouseId = wh.body.id;

    const sup = await request(app)
      .post("/api/suppliers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Concurrency Supplier", phone: "7000000001" });
    expect(sup.status).toBe(201);
    supplierId = sup.body.id;

    const cust = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Concurrency Customer", phone: "7000000002" });
    expect(cust.status).toBe(201);
    customerId = cust.body.id;

    const product = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Concurrency Product" });
    expect(product.status).toBe(201);
    const variant = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ product_id: product.body.id, color: "Green" });
    expect(variant.status).toBe(201);
    variantId = variant.body.id;

    // Baseline stock = 100
    const purchase = await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        items: [{ variant_id: variantId, quantity: 100 }],
      });
    expect(purchase.status).toBe(201);
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it("does not oversell under parallel sale requests", async () => {
    const saleRequests = Array.from({ length: 8 }).map(() =>
      request(app)
        .post("/api/sales")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer_id: customerId,
          warehouse_id: warehouseId,
          items: [{ variant_id: variantId, quantity: 15 }],
        })
    );

    const responses = await Promise.all(saleRequests);
    const successCount = responses.filter((r) => r.status === 201).length;
    const rejectCount = responses.filter((r) => r.status >= 400).length;

    // With 100 stock and request qty=15, max accepted requests is 6.
    expect(successCount).toBeLessThanOrEqual(6);
    expect(successCount + rejectCount).toBe(8);

    const inv = await request(app)
      .get("/api/inventory")
      .query({ warehouseId })
      .set("Authorization", `Bearer ${token}`);
    expect(inv.status).toBe(200);

    const row = inv.body.data.find((i: any) => i.variantId === variantId);
    expect(row).toBeDefined();
    expect(row.quantity).toBeGreaterThanOrEqual(0);
  }, 20000);
});

