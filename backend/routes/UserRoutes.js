import { Router } from "express";
import { updateUserProfile } from "../controllers/UserController.js";
import { verifyJWT } from "../middleware/AuthMiddleware.js";

const userRouter = Router();

// Check for permission
userRouter.use(verifyJWT);

userRouter.post("/updateUserProfile", updateUserProfile);

export default userRouter;