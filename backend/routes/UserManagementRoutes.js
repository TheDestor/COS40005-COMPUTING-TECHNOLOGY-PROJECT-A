import { Router } from "express";
import { verifyJWT, checkRole } from "../middleware/AuthMiddleware.js";
import { deleteUser, getAllUsers, updateUser } from "../controllers/UserManagementController.js";
import { adminUserListLimiter, adminUserModifyLimiter } from "../middleware/rateLimiter.js";
import { logAdminUsage } from "../middleware/adminMonitor.js";

const UserManagementRouter = Router();

UserManagementRouter.get(
  '/users',
  verifyJWT,
  checkRole(['system_admin']),
  adminUserListLimiter,
  logAdminUsage('admin_users_list'),
  getAllUsers
);

UserManagementRouter.delete(
  '/users/:id',
  verifyJWT,
  checkRole(['system_admin']),
  adminUserModifyLimiter,
  logAdminUsage('admin_users_delete'),
  deleteUser
);

UserManagementRouter.put(
  '/users/:id',
  verifyJWT,
  checkRole(['system_admin']),
  adminUserModifyLimiter,
  logAdminUsage('admin_users_update'),
  updateUser
);

export default UserManagementRouter;