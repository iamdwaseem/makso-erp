import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();
let token = "";
let whA = "";
let whB = "";
let variantId = "";
let productId = "";

async function login() {
  const reg = await request(app).post("/api/auth/register").send({
    name: "Transfer Tester",
    email: "xfer@wareflow.io",
    password: "TestPass@1",
  });
  if (reg.status !== 201 && reg.status !== 409) {
    throw new Error(`register ${reg.status}`);
  }
  const res = await request(app).post("/api/auth/login").send({
    email: "xfer@wareflow.io",
    password: "TestPass@1",
  });
  if (res.status !== 200 || !res.body?.token) throw new Error("login failed");
  return res.body.token as string;
}

describe("Inventory transfers API", () => {
  beforeAll(async () => {
    await cleanDb();
    token = await login();

    const w1 = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "WH Alpha", code: "XFA-01", location: "A" });
    const w2 = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "WH Beta", code: "XFB-02", location: "B" });
    whA = w1.body.id;
    whB = w2.body.id;

    const p = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Xfer Product" });
    productId = p.body.id;

    const v = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${token}`)
      .send({ product_id: productId, color: "Black" });
    variantId = v.body.id;

    await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({
        supplier_id: (
          await request(app).post("/api/suppliers").set("Authorization", `Bearer ${token}`).send({
            name: "S",
            phone: "1",
          })
        ).body.id,
        warehouse_id: whA,
        items: [{ variant_id: variantId, quantity: 100 }],
      });
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it("GET /api/inventory/transfers returns paginated list", async () => {
    const res = await request(app)
      .get("/api/inventory/transfers")
      .query({ limit: 10 })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
  });

  it("POST create + submit moves stock between warehouses", async () => {
    const create = await request(app)
      .post("/api/inventory/transfers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        source_warehouse_id: whA,
        target_warehouse_id: whB,
        items: [{ variant_id: variantId, quantity: 15 }],
      });
    expect(create.status).toBe(201);
    const tid = create.body.id as string;
    expect(tid).toBeTruthy();

    const submit = await request(app)
      .post(`/api/inventory/transfers/${tid}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(submit.status).toBe(200);
    expect(submit.body.status).toBe("SUBMITTED");

    const inv = await request(app).get("/api/inventory").set("Authorization", `Bearer ${token}`);
    const rows = inv.body.data as { variantId?: string; variant_id?: string; warehouseId?: string; warehouse_id?: string; quantity?: number }[];
    const qty = (wid: string) =>
      rows
        .filter((r) => (r.variantId ?? r.variant_id) === variantId && (r.warehouseId ?? r.warehouse_id) === wid)
        .reduce((s, r) => s + Number(r.quantity ?? 0), 0);

    expect(qty(whA)).toBe(85);
    expect(qty(whB)).toBe(15);
  });

  it("PATCH draft updates lines", async () => {
    const create = await request(app)
      .post("/api/inventory/transfers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        source_warehouse_id: whA,
        target_warehouse_id: whB,
        items: [{ variant_id: variantId, quantity: 1 }],
      });
    const tid = create.body.id as string;

    const patch = await request(app)
      .patch(`/api/inventory/transfers/${tid}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [{ variant_id: variantId, quantity: 3 }],
      });
    expect(patch.status).toBe(200);
    expect(patch.body.items?.[0]?.quantity ?? patch.body.items?.[0]?.quantity).toBe(3);
  });
});
