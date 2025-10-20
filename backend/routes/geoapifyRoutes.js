import { Router } from "express";
import {
  getNearbyPlaces,
  refreshCache,
  getApiUsageStats,
  clearOldCache,
  getDeviceUsageStats,
  getSystemUsageStats,
} from "../controllers/geoapifyController.js";
import {
  geoapifyNearbyLimiter,
  geoapifyRefreshLimiter,
  geoapifyUsageLimiter,
  geoapifyAdminLimiter,
} from "../middleware/rateLimiter.js";

const router = Router();
// Get nearby places with caching
router.get("/nearby-places", geoapifyNearbyLimiter, getNearbyPlaces);

// Manually refresh cache
router.get("/refresh-cache", geoapifyRefreshLimiter, refreshCache);

// Get API usage statistics
router.get("/usage-stats", geoapifyUsageLimiter, getApiUsageStats);

// Clear old cache entries (admin)
router.delete("/clear-cache", geoapifyAdminLimiter, clearOldCache);

router.get("/analytics/device-usage", getDeviceUsageStats);
router.get("/analytics/system-usage", getSystemUsageStats);

export default router;
