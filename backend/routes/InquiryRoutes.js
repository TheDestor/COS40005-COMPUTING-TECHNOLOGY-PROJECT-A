import { getAllInquiries, updateInquiry, deleteInquiry } from "../controllers/InquiryController.js";
import { Router } from "express";
import { checkRole, verifyJWT } from "../middleware/AuthMiddleware.js";
import { logAdminUsage } from "../middleware/adminMonitor.js";
import { adminInquiryReadLimiter, adminInquiryModifyLimiter } from "../middleware/rateLimiter.js";

const inquiryRouter = Router();

inquiryRouter.get("/getAllInquiries", verifyJWT, checkRole(['cbt_admin']), adminInquiryReadLimiter, logAdminUsage('admin_inquiry_list'), getAllInquiries);
inquiryRouter.post("/updateInquiry", verifyJWT, checkRole(['cbt_admin']), adminInquiryModifyLimiter, logAdminUsage('admin_inquiry_update'), updateInquiry);
inquiryRouter.post("/deleteInquiry", verifyJWT, checkRole(['cbt_admin']), adminInquiryModifyLimiter, logAdminUsage('admin_inquiry_delete'), deleteInquiry);

export default inquiryRouter;