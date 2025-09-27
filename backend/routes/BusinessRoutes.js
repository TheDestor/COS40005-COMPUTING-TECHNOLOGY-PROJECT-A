import { Router } from "express";
import { verifyJWT, checkRole, attachUserIfPresent } from "../middleware/AuthMiddleware.js";
import multer from "multer";

// Import business controllers (we'll create these next)
import {
    addBusiness,
    getAllBusinesses,
    getBusinessById,
    updateBusinessStatus,
    updateBusinessDetails,
    deleteBusiness,
    getBusinessesByStatus,
    getAllApprovedBusinesses,
    getBusinessesByOwner,
    getMySubmissions
} from "../controllers/BusinessController.js";

const businessRouter = Router();

// Configure multer for file uploads
const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes));
    }
});

// Setup multiple file upload for business image and owner avatar
const businessUpload = upload.fields([
    { name: 'businessImage', maxCount: 1 },
    { name: 'ownerAvatar', maxCount: 1 }
]);

// Public
businessRouter.get("/approved", getAllApprovedBusinesses);

// Business user only routes
businessRouter.post("/addBusiness", verifyJWT, checkRole(['business']), businessUpload, addBusiness);
businessRouter.get("/mine", verifyJWT, checkRole(['business']), getBusinessesByOwner);
businessRouter.get("/my-submissions", verifyJWT, checkRole(['business']), getMySubmissions);
businessRouter.put("/updateMyBusiness/:id", verifyJWT, checkRole(['business']), businessUpload, updateBusinessDetails);
businessRouter.patch("/updateMyBusinessStatus/:id", verifyJWT, checkRole(['business']), updateBusinessStatus);

// CBT Admin-only routes
businessRouter.get("/getAllBusinesses", verifyJWT, checkRole(['cbt_admin']), getAllBusinesses);
businessRouter.get("/getBusinessById/:id", verifyJWT, checkRole(['cbt_admin']), getBusinessById);
businessRouter.get("/getBusinessesByStatus/:status", verifyJWT, checkRole(['cbt_admin']), getBusinessesByStatus);
businessRouter.patch("/updateBusinessStatus/:id", verifyJWT, checkRole(['cbt_admin']), updateBusinessStatus);
businessRouter.put("/updateBusinessDetails/:id", verifyJWT, checkRole(['cbt_admin']), businessUpload, updateBusinessDetails);
businessRouter.delete("/deleteBusiness/:id", verifyJWT, checkRole(['cbt_admin']), deleteBusiness);

export default businessRouter;