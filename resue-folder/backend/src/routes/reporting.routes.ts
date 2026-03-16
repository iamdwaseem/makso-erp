import { Router } from "express";
import { ReportingController } from "../controllers/reporting.controller.js";

const router = Router();
const controller = new ReportingController();

router.get("/overview", controller.getOverview);

export default router;
