import { Request, Response } from "express";
import { ScanService } from "../services/scan.service.js";
import { scanSchema } from "../validators/scan.validator.js";

const scanService = new ScanService();

export class ScanController {
  async processScan(req: Request, res: Response) {
    try {
      const validatedData = scanSchema.parse(req.body);
      const scanLog = await scanService.processScan(validatedData);

      return res.status(201).json(scanLog);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ errors: error.errors });
      }

      if (error.message === "Variant not found for the given SKU") {
         return res.status(404).json({ error: error.message });
      }

      if (error.message === "Insufficient inventory") {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: error.message });
    }
  }
}
