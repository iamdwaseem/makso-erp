import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";

const router = Router();
const authController = new AuthController();

// 10 attempts per 15 minutes per IP on login — brute-force protection
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please wait 15 minutes and try again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5 registrations per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many registration attempts from this IP." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/auth/register", registerLimiter, (req, res) => authController.register(req, res));
router.post("/auth/login",    loginLimiter,    (req, res) => authController.login(req, res));
router.get("/auth/me", authenticate, (req, res) => authController.me(req as any, res));

export default router;
