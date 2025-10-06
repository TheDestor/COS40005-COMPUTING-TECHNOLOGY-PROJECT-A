import { Router } from "express";
import { verifyJWT, checkRole } from "../middleware/AuthMiddleware.js";
import { deleteUser, getAllUsers, updateUser } from "../controllers/UserManagementController.js";

const UserManagementRouter = Router();

UserManagementRouter.get('/users', verifyJWT, checkRole(['system_admin']), getAllUsers);
UserManagementRouter.delete('/users/:id', verifyJWT, checkRole(['system_admin']), deleteUser);
UserManagementRouter.put('/users/:id', verifyJWT, checkRole(['system_admin']), updateUser);

export default UserManagementRouter;