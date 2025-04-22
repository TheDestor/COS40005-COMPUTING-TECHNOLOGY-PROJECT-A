import { Router } from "express";
import { contactUs, updatePassword, updateUserProfile } from "../controllers/UserController.js";
import { verifyJWT } from "../middleware/AuthMiddleware.js";

const userRouter = Router();

userRouter.post("/updateUserProfile", verifyJWT, updateUserProfile);
userRouter.post("/updatePassword", verifyJWT, updatePassword);
userRouter.post("/contactUs", contactUs);

export default userRouter;