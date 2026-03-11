import { describe, expect, it, vi } from "vitest";
import { authorizeRole } from "../src/middleware/role.middleware.js";

describe("authorizeRole middleware (unit)", () => {
  it("calls next when role is allowed", () => {
    const mw = authorizeRole("ADMIN");
    const req: any = { userRole: "ADMIN" };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 when role is not allowed", () => {
    const mw = authorizeRole("ADMIN");
    const req: any = { userRole: "STAFF" };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    mw(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

