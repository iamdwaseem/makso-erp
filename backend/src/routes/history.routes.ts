import { Router } from "express";
import { HistoryController } from "../controllers/history.controller.js";

const router = Router();
const controller = new HistoryController();

router.get("/history", controller.getHistory);

export default router;
