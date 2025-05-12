import { locationModel } from "../models/LocationModel.js";

export const getAllLocations = async (req, res) => {
    try {
        const { type } = req.query;

        const filter = {};
        if (type && type !== 'All') {
            filter.type = new RegExp(`^${type}$`, 'i'); // optional: case-insensitive matching
        }

        const locations = await locationModel.find(filter);
        res.json(locations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while loading locations." });
    }
}

export const addLocation = async (req, res) => {
    
}