import { getAllInquiries } from "../controllers/DashboardController.js";
import { Router } from "express";

const dashboardRouter = Router();

dashboardRouter.get("/getAllInquiries", getAllInquiries);

export default dashboardRouter;