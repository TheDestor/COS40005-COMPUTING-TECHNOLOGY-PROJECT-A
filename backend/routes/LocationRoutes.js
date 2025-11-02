import { Router } from "express";
import {
  addLocation,
  getAllLocations,
  removeLocation,
  updateLocation,
} from "../controllers/LocationController.js";
import { verifyJWT, checkRole } from "../middleware/AuthMiddleware.js";
import { logAdminUsage } from "../middleware/adminMonitor.js";
import {
  locationsLimiter,
  adminLocationModifyLimiter,
} from "../middleware/rateLimiter.js";
import multer from "multer";

const locationRouter = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4.5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes));
    }
});

locationRouter.get("/", locationsLimiter, getAllLocations);

locationRouter.post(
  "/addLocation",
  verifyJWT,
  checkRole(["cbt_admin"]),
  adminLocationModifyLimiter,
  logAdminUsage("admin_location_add"),
  upload.single('image'),
  addLocation
);

locationRouter.post(
  "/removeLocation",
  verifyJWT,
  checkRole(["cbt_admin"]),
  adminLocationModifyLimiter,
  logAdminUsage("admin_location_remove"),
  removeLocation
);

locationRouter.post(
  "/updateLocation",
  verifyJWT,
  checkRole(["cbt_admin"]),
  adminLocationModifyLimiter,
  logAdminUsage("admin_location_update"),
  upload.single('image'),
  updateLocation
);

export default locationRouter;
