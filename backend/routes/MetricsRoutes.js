// MetricsRoutes.js - UPDATE THE ENTIRE FILE
import { Router } from "express";
import {
  recordUniqueVisitor,
  getPageViewsTimeline,
  getAdminMetrics,
} from "../controllers/MetricsController.js";
import { uniqueVisitorLimiter } from "../middleware/rateLimiter.js";
import {
  attachUserIfPresent,
  verifyJWT,
  checkRole,
} from "../middleware/AuthMiddleware.js";

const metricsRouter = Router();

// Public route for recording unique visitors
metricsRouter.post(
  "/unique-visitor",
  attachUserIfPresent,
  uniqueVisitorLimiter,
  recordUniqueVisitor
);

// Admin routes for metrics (protected)
metricsRouter.get(
  "/admin/page-views-timeline",
  verifyJWT,
  checkRole(["system_admin"]),
  getPageViewsTimeline
);
metricsRouter.get(
  "/admin/stats",
  verifyJWT,
  checkRole(["system_admin"]),
  getAdminMetrics
);

export default metricsRouter;
