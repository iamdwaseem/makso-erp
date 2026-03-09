import { Router } from "express";
import { ScanController } from "../controllers/scan.controller.js";

const router = Router();
const scanController = new ScanController();

router.post("/scan", scanController.processScan);

export default router;
