import { Router } from "express";
import { SalesController } from "../controllers/sales.controller.js";
import { SalePaymentController } from "../controllers/sale-payment.controller.js";
import { CreditNoteController } from "../controllers/credit-note.controller.js";

const router = Router();
const salesController = new SalesController();
const salePaymentController = new SalePaymentController();
const creditNoteController = new CreditNoteController();

// Credit notes (static path before :id)
router.get("/credit-notes", creditNoteController.getAll);
router.post("/credit-notes", creditNoteController.create);
router.post("/credit-notes/:id/submit", creditNoteController.submit);

// Sales list and create
router.get("/", salesController.getAll);
router.post("/", salesController.create);

// Sale payments (must be before /:id so /:id/payments matches)
router.get("/:id/payments", salePaymentController.getBySaleId);
router.post("/:id/payments", salePaymentController.create);
router.delete("/:id/payments/:paymentId", salePaymentController.delete);

// Sale by id and actions
router.get("/:id", salesController.getById);
router.patch("/:id", salesController.update);
router.post("/:id/submit", salesController.submit);
router.post("/:id/cancel", salesController.cancel);

export default router;
