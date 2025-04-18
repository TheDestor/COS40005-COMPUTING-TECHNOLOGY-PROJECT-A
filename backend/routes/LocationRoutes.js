import { Router } from "express";
import { locationModel } from "../models/Location.js";

const locationRouter = Router();

locationRouter.get('/', async (req, res) => {
    try {
        const locations = await locationModel.find();
        res.json(locations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An internal server error has occured while trying to load the map" });
    }
});

export default locationRouter;