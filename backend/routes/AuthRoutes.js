import { login, register, logout, businessRegister, refresh, googleLogin, forgotPassword, resetPassword } from "../controllers/AuthController.js";
import { Router } from "express";
import { loginLimiter, googleAuthLimiter, refreshLimiter, registerLimiter, businessRegisterLimiter, forgotPasswordLimiter, resetPasswordLimiter } from "../middleware/rateLimiter.js";

const authRouter = Router();

authRouter.post("/register", registerLimiter, register);
authRouter.post("/businessRegister", businessRegisterLimiter, businessRegister);
authRouter.post("/login", loginLimiter, login);
// New Google auth route
authRouter.post("/google-login", googleAuthLimiter, googleLogin);
authRouter.post("/logout", logout);
authRouter.get("/refresh", refreshLimiter, refresh);
authRouter.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
authRouter.post("/reset-password/:token", resetPasswordLimiter, resetPassword);

export default authRouter;