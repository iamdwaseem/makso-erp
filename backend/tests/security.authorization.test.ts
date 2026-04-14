import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();

let adminToken = "";
let managerToken = "";
let staffToken = "";
let warehouseA = "";
const unassignedWarehouseId = "00000000-0000-0000-0000-000000000123";

async function login(email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  if (res.status !== 200 || !res.body?.token) {
    throw new Error(`Login failed for ${email}: ${res.status}`);
  }
  return res.body.token as string;
}

describe("Authorization matrix", () => {
  beforeAll(async () => {
    await cleanDb();
    await request(app).post("/api/auth/register").send({
      name: "Admin",
      email: "admin-authz@wareflow.io",
      password: "AdminPass@123",
    });
    adminToken = await login("admin-authz@wareflow.io", "AdminPass@123");

    const createManager = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Manager",
        email: "manager-authz@wareflow.io",
        role: "MANAGER",
        password: "ManagerPass@123",
      });
    expect(createManager.status).toBe(201);

    const createStaff = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Staff",
        email: "staff-authz@wareflow.io",
        role: "STAFF",
        password: "StaffPass@123",
      });
    expect(createStaff.status).toBe(201);

    managerToken = await login("manager-authz@wareflow.io", "ManagerPass@123");
    staffToken = await login("staff-authz@wareflow.io", "StaffPass@123");

    const w1 = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "WH-A", code: "WHA", location: "A" });
    expect(w1.status).toBe(201);
    warehouseA = w1.body.id;

    const staff = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);
    const staffUser = (staff.body.data || staff.body).find((u: any) => u.email === "staff-authz@wareflow.io");
    expect(staffUser).toBeDefined();

    const assign = await request(app)
      .post(`/api/users/${staffUser.id}/warehouses`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ warehouseId: warehouseA });
    expect(assign.status).toBe(201);
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it("manager cannot create warehouses (ADMIN only)", async () => {
    const res = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: "WH-M", code: "WHM", location: "M" });
    expect(res.status).toBe(403);
  });

  it("staff cannot create warehouses", async () => {
    const res = await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ name: "WH-X", code: "WHX", location: "X" });
    expect(res.status).toBe(403);
  });

  it("staff can access assigned warehouse and is denied non-assigned warehouse", async () => {
    const allowed = await request(app)
      .get("/api/inventory")
      .query({ warehouseId: warehouseA })
      .set("Authorization", `Bearer ${staffToken}`);
    expect(allowed.status).toBe(200);

    const denied = await request(app)
      .get("/api/inventory")
      .query({ warehouseId: unassignedWarehouseId })
      .set("Authorization", `Bearer ${staffToken}`);
    expect(denied.status).toBe(403);
  });
});

