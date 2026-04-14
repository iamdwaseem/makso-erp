import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();

let adminToken = "";
let staffToken = "";
let warehouseId = "";

async function login(email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

describe("Update request approval workflow", () => {
  beforeAll(async () => {
    await cleanDb();
    await request(app).post("/api/auth/register").send({
      name: "UR Admin",
      email: "ur-admin@wareflow.io",
      password: "AdminPass@123",
    });
    adminToken = await login("ur-admin@wareflow.io", "AdminPass@123");

    const staffRes = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "UR Staff",
        email: "ur-staff@wareflow.io",
        role: "STAFF",
        password: "StaffPass@123",
      });
    expect(staffRes.status).toBe(201);
    staffToken = await login("ur-staff@wareflow.io", "StaffPass@123");

    const w = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "UR-WH", code: "URW", location: "X" });
    expect(w.status).toBe(201);
    warehouseId = w.body.id;

    const usersList = await request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`);
    const staffUser = (usersList.body.data || usersList.body).find((u: any) => u.email === "ur-staff@wareflow.io");
    await request(app)
      .post(`/api/users/${staffUser.id}/warehouses`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ warehouseId: warehouseId });
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it("STAFF product PUT creates pending request and returns 202", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ name: "Staff Edit Product" });
    expect(prod.status).toBe(201);
    const productId = prod.body.id;

    const upd = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ description: "Needs approval" });
    expect(upd.status).toBe(202);
    expect(upd.body.message).toMatch(/approval/i);

    const pending = await prisma.updateRequest.findMany({ where: { status: "pending" } });
    expect(pending.length).toBeGreaterThanOrEqual(1);
    const mine = pending.find(p => p.entity_id === productId);
    expect(mine).toBeDefined();
    expect(mine?.entity_type).toBe("product");
  });

  it("ADMIN approve applies product changes", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Approve Me" });
    const productId = prod.body.id;

    const sub = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ description: "Approved text" });
    expect(sub.status).toBe(202);
    const requestId = sub.body.data.id;

    const appr = await request(app)
      .post(`/api/update-requests/${requestId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(appr.status).toBe(200);
    expect(appr.body.request.status).toBe("approved");

    const get = await request(app).get(`/api/products/${productId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(get.status).toBe(200);
    expect(get.body.description).toBe("Approved text");
  });

  it("second approve returns 409 Request already processed", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Idempotent Approve" });
    const productId = prod.body.id;

    const sub = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ description: "Once" });
    const requestId = sub.body.data.id;

    const first = await request(app)
      .post(`/api/update-requests/${requestId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(first.status).toBe(200);

    const second = await request(app)
      .post(`/api/update-requests/${requestId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(second.status).toBe(409);
    expect(second.body.error).toBe("Request already processed");
  });

  it("ADMIN reject leaves entity unchanged", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Reject Me", description: "Original" });
    const productId = prod.body.id;

    const sub = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ description: "Should not apply" });
    const requestId = sub.body.data.id;

    const rej = await request(app)
      .post(`/api/update-requests/${requestId}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(rej.status).toBe(200);
    expect(rej.body.request.status).toBe("rejected");

    const get = await request(app).get(`/api/products/${productId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(get.body.description).toBe("Original");
  });

  it("approved product name change regenerates product SKU", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Unique Alpha Name" });
    expect(prod.status).toBe(201);
    const beforeSku = prod.body.sku;
    const productId = prod.body.id;

    const sub = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ name: "Unique Beta Renamed" });
    expect(sub.status).toBe(202);
    const requestId = sub.body.data.id;

    await request(app)
      .post(`/api/update-requests/${requestId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    const get = await request(app).get(`/api/products/${productId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(get.body.name).toBe("Unique Beta Renamed");
    expect(get.body.sku).not.toBe(beforeSku);
    expect(get.body.sku).toMatch(/^UNIQU-/); // "Unique Beta Renamed" → UNIQU + seq
  });

  it("GET /update-requests lists pending for ADMIN", async () => {
    const list = await request(app).get("/api/update-requests").set("Authorization", `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
  });

  it("approved variant color change regenerates variant SKU", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Variant Sku Regen Prod" });
    const productId = prod.body.id;
    const productSku = prod.body.sku;

    const v = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ product_id: productId, color: "Navy" });
    expect(v.status).toBe(201);
    const variantId = v.body.id;
    const beforeVarSku = v.body.sku;

    const sub = await request(app)
      .put(`/api/variants/${variantId}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ color: "Crimson Red" });
    expect(sub.status).toBe(202);
    const requestId = sub.body.data.id;

    await request(app)
      .post(`/api/update-requests/${requestId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    const get = await request(app).get(`/api/variants/${variantId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(get.body.color).toBe("Crimson Red");
    expect(get.body.sku).not.toBe(beforeVarSku);
    const name5 = productSku.split("-")[0];
    expect(get.body.sku.startsWith(`${name5}-`)).toBe(true);
  });

  it("STAFF cannot delete product", async () => {
    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ name: "Delete Guard" });
    const del = await request(app)
      .delete(`/api/products/${prod.body.id}`)
      .set("Authorization", `Bearer ${staffToken}`);
    expect(del.status).toBe(403);
  });
});
