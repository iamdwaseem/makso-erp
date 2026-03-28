import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();

let adminToken = "";
let managerToken = "";
let staffToken = "";

async function login(email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

describe("SKU history", () => {
  beforeAll(async () => {
    await cleanDb();
    await request(app).post("/api/auth/register").send({
      name: "Hist Admin",
      email: "hist-admin@wareflow.io",
      password: "AdminPass@123",
    });
    adminToken = await login("hist-admin@wareflow.io", "AdminPass@123");

    await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Hist Manager",
        email: "hist-mgr@wareflow.io",
        role: "MANAGER",
        password: "ManagerPass@123",
      });
    managerToken = await login("hist-mgr@wareflow.io", "ManagerPass@123");

    await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Hist Staff",
        email: "hist-staff@wareflow.io",
        role: "STAFF",
        password: "StaffPass@123",
      });
    staffToken = await login("hist-staff@wareflow.io", "StaffPass@123");

    const w = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "H-WH", code: "HWH", location: "X" });
    expect(w.status).toBe(201);

    const users = await request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`);
    const list = users.body.data || users.body;
    const staffUser = list.find((u: any) => u.email === "hist-staff@wareflow.io");
    const mgrUser = list.find((u: any) => u.email === "hist-mgr@wareflow.io");
    await request(app)
      .post(`/api/users/${staffUser.id}/warehouses`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ warehouseId: w.body.id });
    await request(app)
      .post(`/api/users/${mgrUser.id}/warehouses`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ warehouseId: w.body.id });
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it("records name_change on direct product rename and cascades variant rows", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Hist Product A" });
    const productId = prod.body.id;
    const productSkuBefore = prod.body.sku;

    const v = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ product_id: productId, color: "Red" });
    const variantId = v.body.id;

    await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Jumbo Product Renamed" });

    const prodHist = await prisma.skuHistory.findMany({
      where: { entity_type: "product", entity_id: productId },
    });
    expect(prodHist.length).toBe(1);
    expect(prodHist[0].reason).toBe("name_change");
    expect(prodHist[0].old_sku).toBe(productSkuBefore);

    const varHist = await prisma.skuHistory.findMany({
      where: { entity_type: "variant", entity_id: variantId },
    });
    expect(varHist.length).toBe(1);
    expect(varHist[0].reason).toBe("name_change");
  });

  it("manual product SKU creates manual_override row", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Manual Hist Prod" });
    const oldSku = prod.body.sku;

    await request(app)
      .put(`/api/products/${prod.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sku: "MAN-HIST-99" });

    const rows = await prisma.skuHistory.findMany({
      where: { entity_type: "product", entity_id: prod.body.id },
    });
    expect(rows.some(r => r.reason === "manual_override" && r.old_sku === oldSku && r.new_sku === "MAN-HIST-99")).toBe(
      true
    );
  });

  it("description-only update does not create history", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "No Hist Desc" });

    const before = await prisma.skuHistory.count({
      where: { entity_type: "product", entity_id: prod.body.id },
    });

    await request(app)
      .put(`/api/products/${prod.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Only desc" });

    const after = await prisma.skuHistory.count({
      where: { entity_type: "product", entity_id: prod.body.id },
    });
    expect(after).toBe(before);
  });

  it("variant size-only change logs size_change reason", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Var Size Hist" });
    const v = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ product_id: prod.body.id, color: "Green", size: "Medium" });
    const variantId = v.body.id;
    const oldSku = v.body.sku;

    await request(app)
      .put(`/api/variants/${variantId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ size: "Large" });

    const rows = await prisma.skuHistory.findMany({ where: { entity_type: "variant", entity_id: variantId } });
    expect(rows.some(r => r.reason === "size_change" && r.old_sku === oldSku)).toBe(true);
  });

  it("variant color_change logs color_change reason", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Var Color Hist" });
    const v = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ product_id: prod.body.id, color: "Blue" });
    const variantId = v.body.id;
    const oldSku = v.body.sku;

    await request(app)
      .put(`/api/variants/${variantId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ color: "Yellow" });

    const rows = await prisma.skuHistory.findMany({ where: { entity_type: "variant", entity_id: variantId } });
    expect(rows.some(r => r.reason === "color_change" && r.old_sku === oldSku)).toBe(true);
  });

  it("GET /sku-history returns rows for MANAGER", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Mgr Hist Prod" });

    await request(app)
      .put(`/api/products/${prod.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Mgr Hist Prod New" });

    const res = await request(app)
      .get(`/api/sku-history/product/${prod.body.id}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /sku-history returns rows for ADMIN", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "API Hist Prod" });

    await request(app)
      .put(`/api/products/${prod.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "API Hist Prod New" });

    const res = await request(app)
      .get(`/api/sku-history/product/${prod.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].reason).toBeDefined();
  });

  it("STAFF cannot read sku history", async () => {
    const res = await request(app)
      .get("/api/sku-history/product/00000000-0000-0000-0000-000000000001")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });
});
