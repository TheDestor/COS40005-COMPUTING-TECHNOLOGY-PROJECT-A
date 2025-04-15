import { login, register, logout, businessRegister, getAuthStatus } from "../controllers/authController.js";
import { isAuthenticated } from "../middleware/AuthMiddleware.js";
import { Router } from "express";
const router = Router();

router.post("/register", register);
router.post("/businessRegister", businessRegister);
router.post("/login", login);
router.post("/logout", logout);

router.get("/status", isAuthenticated, getAuthStatus);

export default router;