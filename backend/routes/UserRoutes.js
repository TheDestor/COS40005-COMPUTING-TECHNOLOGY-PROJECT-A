import { Router } from "express";
import { contactUs, updateAvatar, updatePassword, updateUserProfile } from "../controllers/UserController.js";
import { verifyJWT } from "../middleware/AuthMiddleware.js";

const userRouter = Router();

userRouter.post("/updateUserProfile", verifyJWT, updateUserProfile);
userRouter.post("/updatePassword", verifyJWT, updatePassword);
userRouter.post("/updateAvatar", updateAvatar);
userRouter.post("/contactUs", contactUs);

export default userRouter;