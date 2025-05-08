import { getAllInquiries, updateInquiry } from "../controllers/InquiryController.js";
import { Router } from "express";
import { verifyJWT } from "../middleware/AuthMiddleware.js";

const inquiryRouter = Router();

inquiryRouter.get("/getAllInquiries", getAllInquiries);
inquiryRouter.post("/updateInquiry", updateInquiry);

export default inquiryRouter;