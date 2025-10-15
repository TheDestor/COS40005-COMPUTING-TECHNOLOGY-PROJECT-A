import { Router } from "express";
import { addLocation, getAllLocations, removeLocation, updateLocation } from "../controllers/LocationController.js";
import { verifyJWT, checkRole } from "../middleware/AuthMiddleware.js";
import { locationsLimiter } from "../middleware/rateLimiter.js";

const locationRouter = Router();

locationRouter.get('/', locationsLimiter, getAllLocations);
locationRouter.post("/addLocation", verifyJWT, checkRole(['cbt_admin']), addLocation);
locationRouter.post("/removeLocation", verifyJWT, checkRole(['cbt_admin']), removeLocation);
locationRouter.post("/updateLocation", verifyJWT, checkRole(['cbt_admin']), updateLocation);

export default locationRouter;