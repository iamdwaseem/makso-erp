import { Request, Response } from "express";
import { UserService } from "../services/user.service.js";
import { BaseController } from "./BaseController.js";

export class UserController extends BaseController {
  async listUsers(req: Request, res: Response) {
    try {
      const organizationId = this.getTenant(req);
      const service = new UserService(organizationId);
      const users = await service.findAll();
      return this.success(res, { data: users, meta: {} });
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

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

  async deleteUser(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const organizationId = this.getTenant(req);
      const service = new UserService(organizationId);
      await service.deleteUser(id);
      return res.status(204).send();
    } catch (error: any) {
      return this.handleError(res, error, "User not found");
    }
  }
}
