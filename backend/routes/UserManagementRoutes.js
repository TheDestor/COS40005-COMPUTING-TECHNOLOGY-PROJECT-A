import { Router } from "express";
import { verifyJWT, checkRole } from "../middleware/AuthMiddleware.js";
import { getAllUsers } from "../controllers/UserManagementController.js";

const UserManagementRouter = Router();

UserManagementRouter.get('/', verifyJWT, checkRole(['system_admin']), getAllUsers);

export default UserManagementRouter;