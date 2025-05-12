import { Router } from "express";
import { getAllLocations } from "../controllers/LocationController.js";

const locationRouter = Router();

locationRouter.get('/', getAllLocations);

export default locationRouter;