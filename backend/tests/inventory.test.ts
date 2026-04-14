import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();
let token = "";
let supplierId = "";
let customerId = "";
let productId = "";
let variantId = "";
let warehouseId = "";
let purchaseId = "";
let purchaseItemId = "";

async function getToken() {
  const registerRes = await request(app).post("/api/auth/register").send({ name: "Tester", email: "inv@wareflow.io", password: "TestPass@1" });
  if (registerRes.status !== 201 && registerRes.status !== 409) {
    throw new Error(`Registration failed: ${registerRes.status} ${JSON.stringify(registerRes.body)}`);
  }
  const res = await request(app).post("/api/auth/login").send({ email: "inv@wareflow.io", password: "TestPass@1" });
  if (res.status !== 200 || !res.body?.token) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

describe("Inventory & Stock Flow", () => {
  beforeAll(async () => {
    await cleanDb();
    token = await getToken();

    // Seed supplier + customer
    const sup = await request(app).post("/api/suppliers").set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Supplier", phone: "9999999999" });
    supplierId = sup.body.id;

    const cust = await request(app).post("/api/customers").set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Customer", phone: "8888888888" });
    customerId = cust.body.id;

    const warehouse = await request(app).post("/api/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Main Warehouse", code: "MAIN-01", location: "Test City" });
    if (warehouse.status !== 201) {
      throw new Error(`Warehouse creation failed: ${warehouse.status} ${JSON.stringify(warehouse.body)}`);
    }
    warehouseId = warehouse.body.id;
  });

  afterAll(async () => { await cleanDb(); await prisma.$disconnect(); });

  it("POST /api/products — should auto-generate SKU from name", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Alpha Bag" });

    expect(res.status).toBe(201);
    expect(res.body.sku).toMatch(/^ALPHA-[A-Z]{2}$/); // Alpha Bag → first 5 letters + seq
    productId = res.body.id;
  });

  it("POST /api/products — should accept an explicit SKU", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Beta Bag", sku: "CUSTOM-SKU-99" });

    expect(res.status).toBe(201);
    expect(res.body.sku).toBe("CUSTOM-SKU-99");
  });

  it("POST /api/variants — should auto-generate SKU from product SKU + colour", async () => {
    const res = await request(app).post("/api/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ product_id: productId, color: "Midnight Blue" });

    expect(res.status).toBe(201);
    // Should include color initials
    expect(res.body.sku).toContain("MID"); // Midnight Blue → 3-letter color block
    variantId = res.body.id;
  });

  it("POST /api/purchases — should stock IN and update inventory", async () => {
    const res = await request(app).post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({ supplier_id: supplierId, warehouse_id: warehouseId, items: [{ variant_id: variantId, quantity: 50 }] });

    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(50);
    purchaseId = res.body.id;
    purchaseItemId = res.body.items[0].id;

    // Verify inventory was updated
    const inv = await request(app).get("/api/inventory")
      .set("Authorization", `Bearer ${token}`);
    const found = inv.body.data.find((i: any) => i.variantId === variantId);
    expect(found?.quantity).toBe(50);
  });

  it("PATCH /api/purchases — GRN catalog labels regenerate product and variant SKUs", async () => {
    const vBefore = await request(app).get(`/api/variants/${variantId}`).set("Authorization", `Bearer ${token}`);
    const pBefore = await request(app).get(`/api/products/${productId}`).set("Authorization", `Bearer ${token}`);
    expect(vBefore.status).toBe(200);
    expect(pBefore.status).toBe(200);

    const patchRes = await request(app)
      .patch(`/api/purchases/${purchaseId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [
          {
            id: purchaseItemId,
            variant_id: variantId,
            quantity: 50,
            product_name: "Quantum Widget",
            variant_color: "Coral Red",
            variant_size: "",
          },
        ],
      });

    expect(patchRes.status).toBe(200);

    const vAfter = await request(app).get(`/api/variants/${variantId}`).set("Authorization", `Bearer ${token}`);
    const pAfter = await request(app).get(`/api/products/${productId}`).set("Authorization", `Bearer ${token}`);
    expect(vAfter.body.sku).not.toBe(vBefore.body.sku);
    expect(pAfter.body.sku).not.toBe(pBefore.body.sku);
    expect(pAfter.body.sku).toMatch(/^QUANT-[A-Z]{2}$/);
    expect(vAfter.body.sku).toMatch(/^QUANT-COR-NOS-[A-Z]{2}$/);

    const inv = await request(app).get("/api/inventory").set("Authorization", `Bearer ${token}`);
    const found = inv.body.data.find((i: any) => i.variantId === variantId);
    expect(found?.sku ?? found?.variant?.sku).toBe(vAfter.body.sku);
  });

  it("POST /api/sales — should stock OUT and reduce inventory", async () => {
    const res = await request(app).post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({ customer_id: customerId, warehouse_id: warehouseId, items: [{ variant_id: variantId, quantity: 20 }] });

    expect(res.status).toBe(201);

    const inv = await request(app).get("/api/inventory")
      .set("Authorization", `Bearer ${token}`);
    const found = inv.body.data.find((i: any) => i.variantId === variantId);
    expect(found?.quantity).toBe(30);
  });

  it("POST /api/sales — should reject sale that exceeds stock with 400", async () => {
    const res = await request(app).post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({ customer_id: customerId, warehouse_id: warehouseId, items: [{ variant_id: variantId, quantity: 9999 }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);
  });

  it("GET /api/inventory/:variantId/ledger — should return ledger with IN and OUT", async () => {
    const res = await request(app)
      .get(`/api/inventory/${variantId}/ledger`)
      .query({ warehouseId })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    const actions = res.body.map((e: any) => e.action);
    expect(actions).toContain("IN");
    expect(actions).toContain("OUT");
  });

  it("GET /api/inventory — should support pagination via limit/offset", async () => {
    const res = await request(app)
      .get("/api/inventory?page=1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(50);
    expect(res.body.meta).toBeDefined();
  });

  it("GET /api/purchases — should return paginated purchases with X-Total-Count", async () => {
    const res = await request(app)
      .get("/api/purchases?limit=10&offset=0")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
  });
});
