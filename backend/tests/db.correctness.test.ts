import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();

describe("Database correctness checks", () => {
  let org1Token = "";

  beforeAll(async () => {
    await cleanDb();
    await request(app).post("/api/auth/register").send({
      name: "Org1 Admin",
      email: "org1-admin@wareflow.io",
      password: "Org1Pass@123",
    });
    const login = await request(app).post("/api/auth/login").send({
      email: "org1-admin@wareflow.io",
      password: "Org1Pass@123",
    });
    org1Token = login.body.token;
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it("API does not expose other organizations' products (direct DB insert)", async () => {
    const org2 = await (prisma as any).organization.create({
      data: { id: crypto.randomUUID(), name: "Org Two", slug: `org-two-${Date.now()}` },
    });

    const secret = await (prisma as any).product.create({
      data: {
        id: crypto.randomUUID(),
        name: "Org2 Secret Product",
        sku: `ORG2-${Date.now()}`,
        organization_id: org2.id,
      },
    });

    const list = await request(app).get("/api/products").set("Authorization", `Bearer ${org1Token}`);
    expect(list.status).toBe(200);
    const rows = Array.isArray(list.body.data) ? list.body.data : [];
    expect(rows.some((p: { id: string }) => p.id === secret.id)).toBe(false);
  });

  it("enforces unique email constraint at DB layer", async () => {
    const org = await (prisma as any).organization.findFirst();
    const hashed = await bcrypt.hash("RepeatPass@123", 12);
    await (prisma as any).user.create({
      data: {
        id: crypto.randomUUID(),
        name: "Repeat One",
        email: "repeat@wareflow.io",
        password: hashed,
        role: "STAFF",
        organization_id: org.id,
      },
    });

    await expect(
      (prisma as any).user.create({
        data: {
          id: crypto.randomUUID(),
          name: "Repeat Two",
          email: "repeat@wareflow.io",
          password: hashed,
          role: "STAFF",
          organization_id: org.id,
        },
      })
    ).rejects.toBeTruthy();
  });
});

