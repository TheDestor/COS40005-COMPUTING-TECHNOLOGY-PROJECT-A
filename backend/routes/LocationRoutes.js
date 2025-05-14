import { Router } from "express";
import { addLocation, getAllLocations } from "../controllers/LocationController.js";
import multer from "multer";

const locationRouter = Router();

locationRouter.get('/', getAllLocations);
locationRouter.post("/addLocation", addLocation);

export default locationRouter;