import { Router } from "express";
import { addLocation, getAllLocations, removeLocation, updateLocation } from "../controllers/LocationController.js";
import { verifyJWT, checkRole } from "../middleware/AuthMiddleware.js";
import { logAdminUsage } from "../middleware/adminMonitor.js";
import { locationsLimiter, adminLocationModifyLimiter } from "../middleware/rateLimiter.js";

const locationRouter = Router();

locationRouter.get('/', locationsLimiter, getAllLocations);
locationRouter.post("/addLocation", verifyJWT, checkRole(['cbt_admin']), adminLocationModifyLimiter, logAdminUsage('admin_location_add'), addLocation);
locationRouter.post("/removeLocation", verifyJWT, checkRole(['cbt_admin']), adminLocationModifyLimiter, logAdminUsage('admin_location_remove'), removeLocation);
locationRouter.post("/updateLocation", verifyJWT, checkRole(['cbt_admin']), adminLocationModifyLimiter, logAdminUsage('admin_location_update'), updateLocation);

export default locationRouter;