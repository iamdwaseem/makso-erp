import { Request, Response } from "express";
import { PurchaseService } from "../services/purchase.service.js";
import { purchaseSchema, purchaseUpdateSchema, purchaseImportSchema } from "../validators/purchase.validator.js";
import { BaseController } from "./BaseController.js";

export class PurchaseController extends BaseController {
  private getService(req: Request): PurchaseService {
    const ctx = this.getServiceContext(req);
    return new PurchaseService(
      ctx.organizationId,
      ctx.userId,
      ctx.userRole,
      ctx.allowedWarehouseIds
    );
  }

  getAllPurchases = async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = this.getPagination(req);
      const includeDeleted = String(req.query.includeDeleted ?? "").toLowerCase() === "true";
      const deletedOnly = String(req.query.deletedOnly ?? "").toLowerCase() === "true";
      const statusRaw = typeof req.query.status === "string" ? req.query.status.trim().toUpperCase() : "";
      const status =
        statusRaw === "DRAFT" || statusRaw === "SUBMITTED" || statusRaw === "CANCELLED" ? statusRaw : undefined;
      const service = this.getService(req);
      const result = await service.getAllPurchases({
        page,
        limit,
        includeDeleted,
        deletedOnly,
        search: search?.trim() || undefined,
        status,
      });
      return res.status(200).json(result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  getPurchaseById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const includeDeleted = String(req.query.includeDeleted ?? "").toLowerCase() === "true";
      const service = this.getService(req);
      const purchase = await service.getPurchaseById(id, { includeDeleted });
      return res.status(200).json(purchase);
    } catch (error: any) {
      return this.handleError(res, error, "Purchase not found");
    }
  }

  createPurchase = async (req: Request, res: Response) => {
    try {
      const validatedData = purchaseSchema.parse(this.getBody(req));
      const service = this.getService(req);
      const purchase = await service.createPurchase(validatedData);
      return res.status(201).json(purchase);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  updatePurchase = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = purchaseUpdateSchema.parse(this.getBody(req));
      const service = this.getService(req);
      const purchase = await service.updatePurchase(id, validatedData);
      return res.status(200).json(purchase);
    } catch (error: any) {
      if (error.message === "Cannot update deleted purchase") {
        return res.status(409).json({ error: error.message });
      }
      return this.handleError(res, error, "Purchase not found");
    }
  };

  deletePurchase = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const ctx = this.getServiceContext(req);
      const service = this.getService(req);
      await service.softDeletePurchase(id, ctx.userId ?? null);
      return res.status(204).send();
    } catch (error: any) {
      if (error.message === "Purchase already deleted") {
        return res.status(409).json({ error: error.message });
      }
      return this.handleError(res, error, "Purchase not found");
    }
  };

  restorePurchase = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      await service.restorePurchase(id);
      const purchase = await service.getPurchaseById(id);
      return res.status(200).json(purchase);
    } catch (error: any) {
      return this.handleError(res, error, "Purchase not found");
    }
  };

  importFromCsv = async (req: Request, res: Response) => {
    try {
      const validatedData = purchaseImportSchema.parse(this.getBody(req));
      const service = this.getService(req);
      const purchase = await service.importFromCsv(validatedData);
      return res.status(201).json(purchase);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };
}
