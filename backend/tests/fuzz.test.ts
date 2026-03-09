/**
 * Fuzz / Dirty-Data Tests
 *
 * Rule: The API must NEVER return a 500 or crash for any garbage input.
 * Acceptable responses: 400 Bad Request, 404 Not Found, or a clean 200/201.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();
let token = "";
let supplierId = "";
let customerId = "";
let productId = "";
let variantId = "";

beforeAll(async () => {
  await cleanDb();

  // Register + login
  await request(app).post("/api/auth/register")
    .send({ name: "FuzzBot", email: "fuzz@wareflow.io", password: "FuzzPass@1" });
  const loginRes = await request(app).post("/api/auth/login")
    .send({ email: "fuzz@wareflow.io", password: "FuzzPass@1" });
  token = loginRes.body.token;

  // Minimal data for downstream tests
  const sup = await request(app).post("/api/suppliers").set("Authorization", `Bearer ${token}`)
    .send({ name: "Fuzz Supplier", phone: "1234567890" });
  supplierId = sup.body.id;

  const cust = await request(app).post("/api/customers").set("Authorization", `Bearer ${token}`)
    .send({ name: "Fuzz Customer", phone: "0987654321" });
  customerId = cust.body.id;

  const prod = await request(app).post("/api/products").set("Authorization", `Bearer ${token}`)
    .send({ name: "Fuzz Product" });
  productId = prod.body.id;

  const vari = await request(app).post("/api/variants").set("Authorization", `Bearer ${token}`)
    .send({ product_id: productId, color: "Red" });
  variantId = vari.body.id;

  // Stock it so we can test over-sell
  await request(app).post("/api/purchases").set("Authorization", `Bearer ${token}`)
    .send({ supplier_id: supplierId, items: [{ variant_id: variantId, quantity: 10 }] });
});

afterAll(async () => { await cleanDb(); await prisma.$disconnect(); });

// ── Helper ───────────────────────────────────────────────────────────────────
function auth() { return { Authorization: `Bearer ${token}` }; }
function neverCrash(status: number) {
  expect(status).not.toBe(500);
  expect(status).not.toBe(502);
  expect(status).not.toBe(503);
}

// ── 1. Auth fuzz ─────────────────────────────────────────────────────────────
describe("Auth — dirty input", () => {
  it("login with missing fields → not 500", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    neverCrash(res.status);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("login with 10 MB password → not 500", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: "x@x.com", password: "A".repeat(10_000_000) });
    neverCrash(res.status);
  });

  it("login with SQL injection email → not 500", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: "'; DROP TABLE users; --", password: "x" });
    neverCrash(res.status);
  });

  it("login with emoji credentials → not 500", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: "🔥@💀.com", password: "🚀🚀🚀" });
    neverCrash(res.status);
  });
});

// ── 2. Product fuzz ───────────────────────────────────────────────────────────
describe("Products — dirty input", () => {
  it("create with missing name → 400", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
  });

  it("create with 10 MB product name → not 500", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "A".repeat(10_000_000) });
    neverCrash(res.status);
  });

  it("create with emoji name → 201 (emojis are valid)", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "🔥 Product 🚀" });
    neverCrash(res.status);
    // Emoji names are valid — backend strips emoji for SKU but stores name as-is
    expect([200, 201]).toContain(res.status);
  });

  it("create with SQL injection name → not 500", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "'; DROP TABLE products; --" });
    neverCrash(res.status);
  });

  it("create with null name → 400", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: null });
    expect(res.status).toBe(400);
  });

  it("create with number name → not 500", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: 12345 });
    neverCrash(res.status);
  });
});

// ── 3. Purchases / inventory quantity fuzz ────────────────────────────────────
describe("Purchases — dirty quantity", () => {
  it("negative quantity → not 500", async () => {
    const res = await request(app).post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({ supplier_id: supplierId, items: [{ variant_id: variantId, quantity: -50 }] });
    neverCrash(res.status);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("zero quantity → not 500", async () => {
    const res = await request(app).post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({ supplier_id: supplierId, items: [{ variant_id: variantId, quantity: 0 }] });
    neverCrash(res.status);
  });

  it("float quantity → not 500", async () => {
    const res = await request(app).post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({ supplier_id: supplierId, items: [{ variant_id: variantId, quantity: 1.7 }] });
    neverCrash(res.status);
  });

  it("string quantity → not 500", async () => {
    const res = await request(app).post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({ supplier_id: supplierId, items: [{ variant_id: variantId, quantity: "lots" }] });
    neverCrash(res.status);
  });

  it("missing items array → not 500", async () => {
    const res = await request(app).post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({ supplier_id: supplierId });
    neverCrash(res.status);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ── 4. Sales fuzz ─────────────────────────────────────────────────────────────
describe("Sales — dirty input", () => {
  it("sell more than in stock → 400 not 500", async () => {
    const res = await request(app).post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({ customer_id: customerId, items: [{ variant_id: variantId, quantity: 99999 }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);
  });

  it("non-existent variant_id → not 500", async () => {
    const res = await request(app).post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({ customer_id: customerId, items: [{ variant_id: "00000000-0000-0000-0000-000000000000", quantity: 1 }] });
    neverCrash(res.status);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("empty items array → not 500", async () => {
    const res = await request(app).post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({ customer_id: customerId, items: [] });
    neverCrash(res.status);
  });
});

// ── 5. Soft delete audit ───────────────────────────────────────────────────────
describe("Soft Delete — audit trail integrity", () => {
  it("deleted product disappears from GET /api/products", async () => {
    const createRes = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Delete Me Product" });
    expect(createRes.status).toBe(201);
    const newId = createRes.body.id;

    const deleteRes = await request(app).delete(`/api/products/${newId}`)
      .set("Authorization", `Bearer ${token}`);
    // DELETE returns 204 No Content
    expect([200, 204]).toContain(deleteRes.status);

    const listRes = await request(app).get("/api/products")
      .set("Authorization", `Bearer ${token}`);
    const found = listRes.body.find((p: any) => p.id === newId);
    expect(found).toBeUndefined(); // hidden from list
  });

  it("history endpoint still returns sales referencing deleted variant", async () => {
    // Make a sale
    await request(app).post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({ customer_id: customerId, items: [{ variant_id: variantId, quantity: 1 }] });

    // Soft-delete the variant
    await request(app).delete(`/api/variants/${variantId}`)
      .set("Authorization", `Bearer ${token}`);

    // Sales history must still show the transaction
    const histRes = await request(app).get("/api/sales")
      .set("Authorization", `Bearer ${token}`);
    expect(histRes.status).toBe(200);
    const hasSale = histRes.body.some((s: any) =>
      s.items?.some((i: any) => i.variant_id === variantId)
    );
    expect(hasSale).toBe(true); // audit trail intact
  });
});

// ── 6. Zero Inventory Guard — Ghost Stock Prevention ──────────────────────────
describe("Zero Inventory Guard — cannot delete with live stock", () => {
  let guardProductId = "";
  let guardVariantId = "";

  beforeAll(async () => {
    // Create a fresh product + variant + stock in for guard tests
    const prod = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Guard Test Product" });
    guardProductId = prod.body.id;

    const vari = await request(app).post("/api/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ product_id: guardProductId, color: "Blue" });
    guardVariantId = vari.body.id;

    await request(app).post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({ supplier_id: supplierId, items: [{ variant_id: guardVariantId, quantity: 500 }] });
  });

  it("DELETE variant with 500 units in stock → 400 with clear message", async () => {
    const res = await request(app).delete(`/api/variants/${guardVariantId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot delete/i);
    expect(res.body.error).toMatch(/500/); // tells user how many units remain
  });

  it("DELETE product with 500 units in stock → 400 with clear message", async () => {
    const res = await request(app).delete(`/api/products/${guardProductId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot delete/i);
    expect(res.body.error).toMatch(/500/);
  });

  it("DELETE variant succeeds once stock reaches 0", async () => {
    // Sell all stock
    await request(app).post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({ customer_id: customerId, items: [{ variant_id: guardVariantId, quantity: 500 }] });

    const res = await request(app).delete(`/api/variants/${guardVariantId}`)
      .set("Authorization", `Bearer ${token}`);
    expect([200, 204]).toContain(res.status);
  });

  it("DELETE product succeeds when all variants are at 0 / deleted", async () => {
    const res = await request(app).delete(`/api/products/${guardProductId}`)
      .set("Authorization", `Bearer ${token}`);
    expect([200, 204]).toContain(res.status);
  });
});

