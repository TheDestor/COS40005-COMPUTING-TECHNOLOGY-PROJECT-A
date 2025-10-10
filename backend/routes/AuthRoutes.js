import { login, register, logout, businessRegister, refresh, googleLogin, forgotPassword, resetPassword } from "../controllers/AuthController.js";
import { Router } from "express";
import { loginLimiter, googleAuthLimiter, refreshLimiter } from "../middleware/rateLimiter.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/businessRegister", businessRegister);
authRouter.post("/login", loginLimiter, login);
// New Google auth route
authRouter.post("/google-login", googleAuthLimiter, googleLogin);
authRouter.post("/logout", logout);
authRouter.get("/refresh", refreshLimiter, refresh);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password/:token", resetPassword);

export default authRouter;