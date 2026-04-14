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

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it("single word name → 5 letters from name + 2-letter sequence", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Backpack" });
    expect(res.status).toBe(201);
    expect(res.body.sku).toMatch(/^BACKP-[A-Z]{2}$/);
  });

  it("multi-word name uses first five letters A–Z in order", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Michael Kors Tote" });
    expect(res.status).toBe(201);
    expect(res.body.sku).toBe("MICHA-AA");
  });

  it("second product with same name5 block gets next 2-letter sequence", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Michael Kors Bag" });
    expect(res.status).toBe(201);
    expect(res.body.sku).toBe("MICHA-AB");
  });

  it("explicit SKU bypasses generation", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Override Product", sku: "MANUAL-SKU" });
    expect(res.status).toBe(201);
    expect(res.body.sku).toBe("MANUAL-SKU");
  });

  it("duplicate explicit SKU is rejected", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Another Product", sku: "MANUAL-SKU" });
    expect(res.status).toBe(409);
  });

  it("lowercase explicit SKU is stored uppercase", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Case Normalized", sku: "my-manual-99" });
    expect(res.status).toBe(201);
    expect(res.body.sku).toBe("MY-MANUAL-99");
  });

  it("invalid SKU characters are rejected", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Bad Sku Product", sku: "NO_UNDERSCORE" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid SKU/i);
  });

  it("parallel auto-generated product SKUs all succeed with unique SKUs", async () => {
    const n = 4;
    const results = await Promise.all(
      Array.from({ length: n }, () =>
        request(app).post("/api/products").set("Authorization", `Bearer ${token}`).send({ name: "Parallel Widget Line" })
      )
    );
    for (const r of results) {
      expect(r.status).toBe(201);
    }
    const skus = new Set(results.map(r => r.body.sku));
    expect(skus.size).toBe(n);
    for (const r of results) {
      expect(r.body.sku).toMatch(/^PARAL-[A-Z]{2}$/);
    }
  });

  it("variant SKU is NAME4-COL3{PRODUCTCODE}-SIZE (empty size → STD)", async () => {
    const prodRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Zip Wallet" });
    const productId = prodRes.body.id;
    expect(prodRes.body.sku).toMatch(/^ZIPWA-[A-Z]{2}$/);

    const varRes = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ product_id: productId, color: "Jet Black" });
    expect(varRes.status).toBe(201);
    // product code is the full Product.sku (here: ZIPWA-??), size defaults to STD
    expect(varRes.body.sku).toMatch(/^ZIPW-JETZIPWA-[A-Z]{2}-STD$/);
  });

  it("variant explicit SKU with invalid characters is rejected", async () => {
    const prodRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Variant Sku Policy Prod" });
    const res = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ product_id: prodRes.body.id, color: "Blue", sku: "bad.variant" });
    expect(res.status).toBe(400);
  });

  it("two variants same colour/size get next 2-letter sequence", async () => {
    const prodRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Canvas Pouch" });
    const productId = prodRes.body.id;

    const v1 = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ product_id: productId, color: "Red" });
    expect(v1.body.sku).toMatch(/^CANV-REDCANVA-[A-Z]{2}-STD$/);

    const v2 = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ product_id: productId, color: "Red" });
    // collision suffix appended after size token
    expect(v2.body.sku).toMatch(/^CANV-REDCANVA-[A-Z]{2}-STD-[A-Z]{2}$/);
    expect(v2.body.sku).not.toBe(v1.body.sku);
  });
});
