import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();

let adminToken = "";
let staffToken = "";
let customerId = "";
let variantId = "";
let warehouseId = "";

async function login(email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

describe("Sale cancel (soft delete + stock reversal)", () => {
  beforeAll(async () => {
    await cleanDb();
    await request(app).post("/api/auth/register").send({
      name: "Sale Cancel Admin",
      email: "sale-cancel-admin@wareflow.io",
      password: "AdminPass@123",
    });
    adminToken = await login("sale-cancel-admin@wareflow.io", "AdminPass@123");

    await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Sale Cancel Staff",
        email: "sale-cancel-staff@wareflow.io",
        role: "STAFF",
        password: "StaffPass@123",
      });
    staffToken = await login("sale-cancel-staff@wareflow.io", "StaffPass@123");

    const w = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "SC-WH", code: "SCWH", location: "X" });
    expect(w.status).toBe(201);
    warehouseId = w.body.id;

    const users = await request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`);
    const list = users.body.data || users.body;
    const staffUser = list.find((u: any) => u.email === "sale-cancel-staff@wareflow.io");
    await request(app)
      .post(`/api/users/${staffUser.id}/warehouses`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ warehouseId: w.body.id });

    const cust = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "SC Customer", phone: "5550001111" });
    customerId = cust.body.id;

    const prod = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "SC Product" });
    const v = await request(app)
      .post("/api/variants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ product_id: prod.body.id, color: "Blue" });
    variantId = v.body.id;

    await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        supplier_id: (
          await request(app)
            .post("/api/suppliers")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "SC Sup", phone: "5550002222" })
        ).body.id,
        warehouse_id: warehouseId,
        items: [{ variant_id: variantId, quantity: 100 }],
      });
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it("create sale → DELETE cancels → stock restored", async () => {
    const before = await request(app)
      .get("/api/inventory")
      .query({ warehouseId })
      .set("Authorization", `Bearer ${adminToken}`);
    const rowBefore = before.body.data.find((i: any) => i.variantId === variantId);
    const qtyBefore = rowBefore?.quantity ?? 0;

    const sale = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        customer_id: customerId,
        warehouse_id: warehouseId,
        items: [{ variant_id: variantId, quantity: 7 }],
      });
    expect(sale.status).toBe(201);
    const saleId = sale.body.id;

    const mid = await request(app)
      .get("/api/inventory")
      .query({ warehouseId })
      .set("Authorization", `Bearer ${adminToken}`);
    const rowMid = mid.body.data.find((i: any) => i.variantId === variantId);
    expect(rowMid?.quantity).toBe(qtyBefore - 7);

    const del = await request(app).delete(`/api/sales/${saleId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(del.status).toBe(204);

    const after = await request(app)
      .get("/api/inventory")
      .query({ warehouseId })
      .set("Authorization", `Bearer ${adminToken}`);
    const rowAfter = after.body.data.find((i: any) => i.variantId === variantId);
    expect(rowAfter?.quantity).toBe(qtyBefore);

    const row = await prisma.sale.findFirst({ where: { id: saleId } });
    expect(row?.deleted_at).not.toBeNull();
  });

  it("cancel twice → 409", async () => {
    const sale = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        customer_id: customerId,
        warehouse_id: warehouseId,
        items: [{ variant_id: variantId, quantity: 1 }],
      });
    const saleId = sale.body.id;

    const first = await request(app).delete(`/api/sales/${saleId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(first.status).toBe(204);

    const second = await request(app).delete(`/api/sales/${saleId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(second.status).toBe(409);
    expect(second.body.error).toMatch(/already deleted/i);
  });

  it("cancel creates SALE_CANCEL_REVERSAL ledger rows", async () => {
    const sale = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        customer_id: customerId,
        warehouse_id: warehouseId,
        items: [
          { variant_id: variantId, quantity: 2 },
          { variant_id: variantId, quantity: 3 },
        ],
      });
    const saleId = sale.body.id;

    await request(app).delete(`/api/sales/${saleId}`).set("Authorization", `Bearer ${adminToken}`);

    const ledgers = await prisma.inventoryLedger.findMany({
      where: {
        reference_type: "SALE_CANCEL_REVERSAL",
        reference_id: saleId,
      },
    });
    expect(ledgers.length).toBe(2);
    expect(ledgers.every(l => l.action === "IN")).toBe(true);
    const sum = ledgers.reduce((a, l) => a + l.quantity, 0);
    expect(sum).toBe(5);
  });

  it("GET /sales?deletedOnly=true lists cancelled sales", async () => {
    const sale = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        customer_id: customerId,
        warehouse_id: warehouseId,
        items: [{ variant_id: variantId, quantity: 1 }],
      });
    const saleId = sale.body.id;
    await request(app).delete(`/api/sales/${saleId}`).set("Authorization", `Bearer ${adminToken}`);

    const active = await request(app).get("/api/sales").set("Authorization", `Bearer ${adminToken}`);
    expect(active.body.data.every((s: any) => !s.deleted_at)).toBe(true);

    const deleted = await request(app)
      .get("/api/sales")
      .query({ deletedOnly: "true" })
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.some((s: any) => s.id === saleId)).toBe(true);
  });

  it("STAFF cannot DELETE /sales/:id", async () => {
    const sale = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        customer_id: customerId,
        warehouse_id: warehouseId,
        items: [{ variant_id: variantId, quantity: 1 }],
      });
    const res = await request(app).delete(`/api/sales/${sale.body.id}`).set("Authorization", `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });
});
