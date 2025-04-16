import { login, register, logout, businessRegister, refresh } from "../controllers/authController.js";
import { Router } from "express";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/businessRegister", businessRegister);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/refresh", refresh);

export default authRouter;