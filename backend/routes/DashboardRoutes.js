import { Router } from "express";
import { getDashboardStats, getRecentInquiries } from "../controllers/DashboardController.js";
import { verifyJWT, checkRole } from "../middleware/AuthMiddleware.js";

const dashboardRouter = Router();

// Get dashboard statistics
dashboardRouter.get("/stats", verifyJWT, checkRole(['cbt_admin']), getDashboardStats);

// Get recent inquiries
dashboardRouter.get("/recent-inquiries", verifyJWT, checkRole(['cbt_admin']), getRecentInquiries);

export default dashboardRouter;