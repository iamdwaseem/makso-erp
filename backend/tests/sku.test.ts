import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();
let token = "";

async function getToken() {
  await request(app).post("/api/auth/register").send({ name: "SKUTester", email: "sku@wareflow.io", password: "TestPass@1" });
  const res = await request(app).post("/api/auth/login").send({ email: "sku@wareflow.io", password: "TestPass@1" });
  return res.body.token;
}

describe("SKU Auto-generation", () => {
  beforeAll(async () => {
    await cleanDb();
    token = await getToken();
  });

  afterAll(async () => { await cleanDb(); await prisma.$disconnect(); });

  it("single word name generates initials + 001", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Backpack" });
    expect(res.status).toBe(201);
    expect(res.body.sku).toBe("B-001");
  });

  it("multi-word name uses all initials", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Michael Kors Tote" });
    expect(res.status).toBe(201);
    expect(res.body.sku).toBe("MKT-001");
  });

  it("second product with same initials gets counter 002", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Modern Kitchen Table" });
    expect(res.status).toBe(201);
    expect(res.body.sku).toBe("MKT-002");
  });

  it("explicit SKU bypasses generation", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Override Product", sku: "MANUAL-SKU" });
    expect(res.status).toBe(201);
    expect(res.body.sku).toBe("MANUAL-SKU");
  });

  it("duplicate explicit SKU is rejected with 500", async () => {
    const res = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Another Product", sku: "MANUAL-SKU" });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("variant SKU is derived from product SKU + colour initials", async () => {
    const prodRes = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Zip Wallet" });
    const productId = prodRes.body.id;
    const productSku = prodRes.body.sku; // e.g. ZW-001

    const varRes = await request(app).post("/api/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ product_id: productId, color: "Jet Black" });
    expect(varRes.status).toBe(201);
    expect(varRes.body.sku).toBe(`${productSku}-JB`);
  });

  it("two variants of same colour on same product get collision suffix", async () => {
    const prodRes = await request(app).post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Canvas Pouch" });
    const productId = prodRes.body.id;
    const productSku = prodRes.body.sku;

    const v1 = await request(app).post("/api/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ product_id: productId, color: "Red" });
    expect(v1.body.sku).toBe(`${productSku}-R`);

    const v2 = await request(app).post("/api/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ product_id: productId, color: "Red" });
    expect(v2.body.sku).toBe(`${productSku}-R-2`);
  });
});
