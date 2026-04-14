import { Router } from "express";
import { authorizeRole } from "../middleware/role.middleware.js";
import { UpdateRequestController } from "../controllers/updateRequest.controller.js";

const router = Router();
const controller = new UpdateRequestController();

router.get("/update-requests", authorizeRole("ADMIN", "MANAGER"), controller.listPending);
router.post("/update-requests/:id/approve", authorizeRole("ADMIN", "MANAGER"), controller.approve);
router.post("/update-requests/:id/reject", authorizeRole("ADMIN", "MANAGER"), controller.reject);

export default router;
