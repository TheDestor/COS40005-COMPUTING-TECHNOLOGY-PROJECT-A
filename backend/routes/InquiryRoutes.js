import { getAllInquiries, updateInquiry } from "../controllers/InquiryController.js";
import { Router } from "express";
import { checkRole, verifyJWT } from "../middleware/AuthMiddleware.js";

const inquiryRouter = Router();

inquiryRouter.get("/getAllInquiries", verifyJWT, checkRole(['cbt_admin']), getAllInquiries);
inquiryRouter.post("/updateInquiry", verifyJWT, checkRole(['cbt_admin']), updateInquiry);

export default inquiryRouter;