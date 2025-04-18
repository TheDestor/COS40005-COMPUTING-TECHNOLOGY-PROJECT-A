import { Router } from "express";
import { contactUs, updateUserProfile } from "../controllers/UserController.js";
import { verifyJWT } from "../middleware/AuthMiddleware.js";

const userRouter = Router();

userRouter.post("/updateUserProfile", verifyJWT, updateUserProfile);
userRouter.post("/contactUs", contactUs);

export default userRouter;