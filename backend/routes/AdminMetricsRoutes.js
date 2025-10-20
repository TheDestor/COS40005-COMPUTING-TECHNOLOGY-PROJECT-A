import { Router } from "express";
import { verifyJWT, checkRole } from "../middleware/AuthMiddleware.js";
import {
  getAdminMetrics,
  getSecurityMetrics,
  getSecuritySessions,
  getWeeklyPageViews,
  getPageViewsByDayOfWeek,
  getMonthlyPageViews,
  getYearlyPageViews,
  getPageViewsByWeekOfCurrentMonth,
} from "../controllers/AdminMetricsController.js";
import { adminMetricsLimiter } from "../middleware/rateLimiter.js";
import { logAdminUsage } from "../middleware/adminMonitor.js";

const adminMetricsRouter = Router();

adminMetricsRouter.get(
  "/stats",
  verifyJWT,
  checkRole(["system_admin"]),
  adminMetricsLimiter,
  logAdminUsage("admin_metrics_stats"),
  getAdminMetrics
);
adminMetricsRouter.get(
  "/security-stats",
  verifyJWT,
  checkRole(["system_admin"]),
  adminMetricsLimiter,
  logAdminUsage("admin_metrics_security_stats"),
  getSecurityMetrics
);
adminMetricsRouter.get(
  "/security-sessions",
  verifyJWT,
  checkRole(["system_admin"]),
  adminMetricsLimiter,
  logAdminUsage("admin_metrics_security_sessions"),
  getSecuritySessions
);
adminMetricsRouter.get(
  "/pageviews-weekly",
  verifyJWT,
  checkRole(["system_admin"]),
  adminMetricsLimiter,
  logAdminUsage("admin_metrics_pageviews_weekly"),
  getWeeklyPageViews
);
adminMetricsRouter.get(
  "/pageviews-weekly-month",
  verifyJWT,
  checkRole(["system_admin"]),
  adminMetricsLimiter,
  logAdminUsage("admin_metrics_pageviews_weekly_month"),
  getPageViewsByWeekOfCurrentMonth
);
adminMetricsRouter.get(
  "/pageviews-dow",
  verifyJWT,
  checkRole(["system_admin"]),
  adminMetricsLimiter,
  logAdminUsage("admin_metrics_pageviews_dow"),
  getPageViewsByDayOfWeek
);
adminMetricsRouter.get(
  "/pageviews-monthly",
  verifyJWT,
  checkRole(["system_admin"]),
  adminMetricsLimiter,
  logAdminUsage("admin_metrics_pageviews_monthly"),
  getMonthlyPageViews
);
adminMetricsRouter.get(
  "/pageviews-yearly",
  verifyJWT,
  checkRole(["system_admin"]),
  adminMetricsLimiter,
  logAdminUsage("admin_metrics_pageviews_yearly"),
  getYearlyPageViews
);

export default adminMetricsRouter;
