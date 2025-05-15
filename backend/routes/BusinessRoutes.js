import { Router } from "express";
import { verifyJWT, checkRole } from "../middleware/AuthMiddleware.js";
import multer from "multer";

// Import business controllers (we'll create these next)
import { 
    addBusiness,
    getAllBusinesses,
    getBusinessById,
    updateBusinessStatus,
    updateBusinessDetails,
    deleteBusiness,
    getBusinessesByStatus
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

// Public routes
businessRouter.post("/addBusiness", businessUpload, addBusiness);
businessRouter.get("/getAllApprovedBusinesses", getAllBusinesses); // For public display

// Admin-only routes
businessRouter.get("/getAllBusinesses", verifyJWT, checkRole(['admin']), getAllBusinesses);
businessRouter.get("/getBusinessById/:id", verifyJWT, checkRole(['admin']), getBusinessById);
businessRouter.get("/getBusinessesByStatus/:status", verifyJWT, checkRole(['admin']), getBusinessesByStatus);
businessRouter.patch("/updateBusinessStatus/:id", verifyJWT, checkRole(['admin']), updateBusinessStatus);
businessRouter.put("/updateBusinessDetails/:id", verifyJWT, checkRole(['admin']), businessUpload, updateBusinessDetails);
businessRouter.delete("/deleteBusiness/:id", verifyJWT, checkRole(['admin']), deleteBusiness);

export default businessRouter;