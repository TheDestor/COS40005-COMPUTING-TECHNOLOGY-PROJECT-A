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

const adminMetricsRouter = Router();

adminMetricsRouter.get(
  "/stats",
  verifyJWT,
  checkRole(["system_admin"]),
  getAdminMetrics
);
adminMetricsRouter.get(
  "/security-stats",
  verifyJWT,
  checkRole(["system_admin"]),
  getSecurityMetrics
);
adminMetricsRouter.get(
  "/security-sessions",
  verifyJWT,
  checkRole(["system_admin"]),
  getSecuritySessions
);
adminMetricsRouter.get(
  "/pageviews-weekly",
  verifyJWT,
  checkRole(["system_admin"]),
  getWeeklyPageViews
);
adminMetricsRouter.get(
  "/pageviews-weekly-month",
  verifyJWT,
  checkRole(["system_admin"]),
  getPageViewsByWeekOfCurrentMonth
);
adminMetricsRouter.get(
  "/pageviews-dow",
  verifyJWT,
  checkRole(["system_admin"]),
  getPageViewsByDayOfWeek
);
adminMetricsRouter.get(
  "/pageviews-monthly",
  verifyJWT,
  checkRole(["system_admin"]),
  getMonthlyPageViews
);
adminMetricsRouter.get(
  "/pageviews-yearly",
  verifyJWT,
  checkRole(["system_admin"]),
  getYearlyPageViews
);

export default adminMetricsRouter;
