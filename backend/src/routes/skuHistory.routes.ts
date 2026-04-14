import { Router } from "express";
import { authorizeRole } from "../middleware/role.middleware.js";
import { SkuHistoryController } from "../controllers/skuHistory.controller.js";

const router = Router();
const controller = new SkuHistoryController();

router.get("/sku-history/:entityType/:entityId", authorizeRole("ADMIN", "MANAGER"), controller.listByEntity);

export default router;
