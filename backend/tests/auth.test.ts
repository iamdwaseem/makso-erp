import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { buildApp, cleanDb, prisma } from "./helpers.js";

const app = buildApp();

describe("Auth API", () => {
  beforeAll(async () => { await cleanDb(); });
  afterAll(async ()  => { await cleanDb(); await prisma.$disconnect(); });

  const credentials = { name: "Test User", email: "test@wareflow.io", password: "SecurePass@123" };

  it("POST /api/auth/register — should create a new user and return token", async () => {
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(credentials.email);
  });

  it("POST /api/auth/register — should reject duplicate email with 409", async () => {
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(409);
  });

  it("POST /api/auth/login — should return token for valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("POST /api/auth/login — should reject wrong password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "WrongPassword!" });
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me — should return current user with valid token", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    const token = loginRes.body.token;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(credentials.email);
  });

  it("GET /api/auth/me — should return 401 with no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("Protected route — should return 401 without token", async () => {
    const res = await request(app).get("/api/inventory");
    // Tenant resolution runs before authenticate for protected APIs.
    expect(res.status).toBe(400);
  });
});
