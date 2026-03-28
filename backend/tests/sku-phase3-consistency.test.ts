import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();

let adminToken = "";

async function login(email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

describe("Phase 3 SKU catalog consistency (direct admin/manager updates)", () => {
  beforeAll(async () => {
    await cleanDb();
    await request(app).post("/api/auth/register").send({
      name: "P3 Admin",
      email: "p3-admin@wareflow.io",
      password: "AdminPass@123",
    });
    adminToken = await login("p3-admin@wareflow.io", "AdminPass@123");

    const w = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "P3-WH", code: "P3W", location: "X" });
    expect(w.status).toBe(201);
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it("ADMIN product name change updates product SKU and cascades variants", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Cascade Parent Name" });
    expect(prod.status).toBe(201);
    const productSkuBefore = prod.body.sku;
    const productId = prod.body.id;

    const v = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ product_id: productId, color: "Blue" });
    expect(v.status).toBe(201);
    const variantSkuBefore = v.body.sku;
    expect(variantSkuBefore.startsWith(`${productSkuBefore.split("-")[0]}-`)).toBe(true);

    const upd = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Delta Parent Renamed" });
    expect(upd.status).toBe(200);
    expect(upd.body.name).toBe("Delta Parent Renamed");
    expect(upd.body.sku).not.toBe(productSkuBefore);

    const v2 = await request(app).get(`/api/variants/${v.body.id}`).set("Authorization", `Bearer ${adminToken}`);
    expect(v2.body.sku).not.toBe(variantSkuBefore);
    expect(v2.body.sku.startsWith(`${upd.body.sku.split("-")[0]}-`)).toBe(true);
  });

  it("ADMIN variant color change updates variant SKU", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Variant Color Product" });
    const productId = prod.body.id;

    const v = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ product_id: productId, color: "Navy" });
    const beforeSku = v.body.sku;

    const upd = await request(app)
      .put(`/api/variants/${v.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ color: "Crimson" });
    expect(upd.status).toBe(200);
    expect(upd.body.color).toBe("Crimson");
    expect(upd.body.sku).not.toBe(beforeSku);
  });

  it("no-op name trim-only does not change SKU when normalized equal", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Stable Name" });
    const skuBefore = prod.body.sku;
    const productId = prod.body.id;

    const upd = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "  Stable   Name  " });
    expect(upd.status).toBe(200);
    expect(upd.body.sku).toBe(skuBefore);
  });

  it("manual product SKU override does not trigger auto regeneration on name change", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Manual Base" });
    const productId = prod.body.id;

    const upd = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Manual New Title", sku: "MY-FIXED-001" });
    expect(upd.status).toBe(200);
    expect(upd.body.sku).toBe("MY-FIXED-001");
    expect(upd.body.name).toBe("Manual New Title");
  });

  it("manual variant SKU override skips auto regen when color changes", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Var Manual Prod" });
    const v = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ product_id: prod.body.id, color: "Green" });

    const upd = await request(app)
      .put(`/api/variants/${v.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ color: "Yellow", sku: "MANUAL-V-01" });
    expect(upd.status).toBe(200);
    expect(upd.body.sku).toBe("MANUAL-V-01");
    expect(upd.body.color).toBe("Yellow");
  });
});
