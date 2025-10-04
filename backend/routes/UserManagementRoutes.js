import { Router } from "express";
import { verifyJWT, checkRole } from "../middleware/AuthMiddleware.js";
import { deleteUser, getAllUsers } from "../controllers/UserManagementController.js";

const UserManagementRouter = Router();

UserManagementRouter.get('/users', verifyJWT, checkRole(['system_admin']), getAllUsers);
UserManagementRouter.delete('/users/:id', verifyJWT, checkRole(['system_admin']), deleteUser);

export default UserManagementRouter;