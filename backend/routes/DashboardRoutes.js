import { Router } from "express";
import { 
  getDashboardStats, 
  getRecentInquiries,
  getLocationBreakdown,
  getMonthlyTrends,
  getNewsletterSubscribers
} from "../controllers/DashboardController.js";
import { verifyJWT, checkRole } from "../middleware/AuthMiddleware.js";
import { adminDashboardLimiter } from "../middleware/rateLimiter.js";
import { logAdminUsage } from "../middleware/adminMonitor.js";

const dashboardRouter = Router();

// All routes require CBT admin authentication
dashboardRouter.get(
  "/stats",
  verifyJWT,
  checkRole(['cbt_admin']),
  adminDashboardLimiter,
  logAdminUsage('admin_dashboard_stats'),
  getDashboardStats
);
dashboardRouter.get(
  "/recent-inquiries",
  verifyJWT,
  checkRole(['cbt_admin']),
  adminDashboardLimiter,
  logAdminUsage('admin_dashboard_recent_inquiries'),
  getRecentInquiries
);
dashboardRouter.get(
  "/location-breakdown",
  verifyJWT,
  checkRole(['cbt_admin']),
  adminDashboardLimiter,
  logAdminUsage('admin_dashboard_location_breakdown'),
  getLocationBreakdown
);
dashboardRouter.get(
  "/monthly-trends",
  verifyJWT,
  checkRole(['cbt_admin']),
  adminDashboardLimiter,
  logAdminUsage('admin_dashboard_monthly_trends'),
  getMonthlyTrends
);
dashboardRouter.get(
  "/newsletter-subscribers",
  verifyJWT,
  checkRole(['cbt_admin']),
  adminDashboardLimiter,
  logAdminUsage('admin_dashboard_newsletter_subscribers'),
  getNewsletterSubscribers
);

export default dashboardRouter;