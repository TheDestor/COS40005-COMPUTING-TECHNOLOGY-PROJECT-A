import { Router } from "express";
import { addLocation, getAllLocations, removeLocation, updateLocation } from "../controllers/LocationController.js";
import multer from "multer";

const locationRouter = Router();

locationRouter.get('/', getAllLocations);
locationRouter.post("/addLocation", addLocation);
locationRouter.post("/removeLocation", removeLocation);
locationRouter.post("/updateLocation", updateLocation);

export default locationRouter;