import { Request, Response } from "express";
import { BaseController } from "./BaseController.js";
import { UserService } from "../services/user.service.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { z } from "zod";

export class UserController extends BaseController {
  /**
   * List all users in the organization.
   */
  async listUsers(req: Request, res: Response) {
    try {
      const organizationId = this.getTenant(req);
      const service = new UserService(organizationId);
      const users = await service.findAll();
      return this.success(res, users);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  /**
   * Create a new user in the organization.
   */
  async createUser(req: Request, res: Response) {
    try {
      const organizationId = this.getTenant(req);
      const service = new UserService(organizationId);
      const body = this.getBody(req);
      const callerRole = (req as AuthRequest).userRole as "ADMIN" | "MANAGER" | "STAFF" | undefined;
      const user = await service.createUser(body, callerRole);
      return this.success(res, user, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  /**
   * Delete a user.
   */
  async deleteUser(req: Request, res: Response) {
      try {
          const id = req.params.id as string;
          const organizationId = this.getTenant(req);
          const service = new UserService(organizationId);
          const callerRole = (req as AuthRequest).userRole as "ADMIN" | "MANAGER" | "STAFF" | undefined;
          await service.deleteUser(id, callerRole);
          return res.status(204).send();
      } catch (error: any) {
          return this.handleError(res, error);
      }
  }

  /**
   * List all warehouses assigned to a specific user.
   */
  async getUserWarehouses(req: Request, res: Response) {
    try {
      const userId = req.params.id as string;
      const organizationId = this.getTenant(req);
      const service = new UserService(organizationId);
      const warehouses = await service.getUserWarehouses(userId);
      return this.success(res, warehouses);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  /**
   * Assign a warehouse to a user.
   */
  async assignWarehouse(req: Request, res: Response) {
    try {
      const userId = req.params.id as string;
      const warehouseId = req.body?.warehouseId as string | undefined;
      const organizationId = this.getTenant(req);
      const service = new UserService(organizationId);

      if (!warehouseId) {
        return res.status(400).json({ error: "warehouseId is required" });
      }

      const callerRole = (req as AuthRequest).userRole as "ADMIN" | "MANAGER" | "STAFF" | undefined;
      const assignment = await service.assignWarehouse(userId, warehouseId, callerRole);

      return this.success(res, assignment, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  /**
   * Remove warehouse assignment from a user.
   */
  async unassignWarehouse(req: Request, res: Response) {
    try {
      const userId = req.params.id as string;
      const warehouseId = req.params.warehouseId as string;
      const organizationId = this.getTenant(req);
      const service = new UserService(organizationId);
      const callerRole = (req as AuthRequest).userRole as "ADMIN" | "MANAGER" | "STAFF" | undefined;

      await service.unassignWarehouse(userId, warehouseId, callerRole);

      return res.status(204).send();
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const organizationId = this.getTenant(req);
      const service = new UserService(organizationId);
      const caller = req as AuthRequest;

      const bodySchema = z
        .object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          role: z.enum(["ADMIN", "MANAGER", "STAFF"]).optional(),
        })
        .strict();
      const data = bodySchema.parse(this.getBody(req));

      const updated = await service.updateUser(
        id,
        data,
        { id: caller.userId, role: caller.userRole as any }
      );
      return this.success(res, updated);
    } catch (error: any) {
      return this.handleError(res, error, "User not found");
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const organizationId = this.getTenant(req);
      const service = new UserService(organizationId);
      const caller = req as AuthRequest;

      const bodySchema = z
        .object({
          newPassword: z.string().min(8, "Password must be at least 8 characters"),
        })
        .strict();
      const { newPassword } = bodySchema.parse(this.getBody(req));

      const result = await service.resetPassword(
        id,
        newPassword,
        { id: caller.userId, role: caller.userRole as any }
      );
      return this.success(res, result);
    } catch (error: any) {
      return this.handleError(res, error, "Failed to reset password");
    }
  }
}
