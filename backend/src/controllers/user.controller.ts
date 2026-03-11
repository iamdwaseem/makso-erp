import { Request, Response } from "express";
import { BaseController } from "./BaseController.js";
import { UserService } from "../services/user.service.js";

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
      const user = await service.createUser(body);
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
          await service.deleteUser(id);
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

      const assignment = await service.assignWarehouse(userId, warehouseId);

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

      await service.unassignWarehouse(userId, warehouseId);

      return res.status(204).send();
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }
}
