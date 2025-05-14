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
    try {
        const { category, type, division, name, status, latitude, longitude, description, image, url} = req.body;
    
        const locationData = {
            id: null,
            category: category,
            type: type,
            division: division,
            name: name,
            latitude: latitude,
            longitude: longitude,
            url: url,
            description: description,
            image: image,
            status: status
        }
        const newLocation = await locationModel.create(locationData);
        console.log(newLocation);
        return res.status(201).json({ message: "Location added successfully", success: true });
    } catch (error) {
        console.error("An error occured while trying to create new location:", error);
        return res.status(500).json({ message: "An error occured while trying to create new location", success: false})
    }
}