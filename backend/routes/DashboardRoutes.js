import { Router } from "express";
import { 
  getDashboardStats, 
  getRecentInquiries,
  getLocationBreakdown,
  getMonthlyTrends,
  getNewsletterSubscribers
} from "../controllers/DashboardController.js";
import { verifyJWT, checkRole } from "../middleware/AuthMiddleware.js";

const dashboardRouter = Router();

// All routes require CBT admin authentication
dashboardRouter.get("/stats", verifyJWT, checkRole(['cbt_admin']), getDashboardStats);
dashboardRouter.get("/recent-inquiries", verifyJWT, checkRole(['cbt_admin']), getRecentInquiries);
dashboardRouter.get("/location-breakdown", verifyJWT, checkRole(['cbt_admin']), getLocationBreakdown);
dashboardRouter.get("/monthly-trends", verifyJWT, checkRole(['cbt_admin']), getMonthlyTrends);
dashboardRouter.get("/newsletter-subscribers", verifyJWT, checkRole(['cbt_admin']), getNewsletterSubscribers);

export default dashboardRouter;