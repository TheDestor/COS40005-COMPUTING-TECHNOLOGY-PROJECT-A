import { login, register, logout, businessRegister, refresh } from "../controllers/AuthController.js";
import { Router } from "express";
import { verifyJWT } from "../middleware/AuthMiddleware.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/businessRegister", businessRegister);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/refresh", refresh, verifyJWT); // Check for permission


export default authRouter;