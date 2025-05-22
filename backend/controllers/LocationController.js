import { locationModel } from "../models/LocationModel.js";

export const getAllLocations = async (req, res) => {
    try {
        const { type } = req.query;

        const filter = {};
        if (type && type !== 'All') {
            filter.type = new RegExp(`^${type}$`, 'i'); // optional: case-insensitive matching
        }

        const locations = await locationModel.find(filter);
        console.log(locations);
        return res.status(200).json(locations);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred while loading locations.", success: false });
    }
}

export const addLocation = async (req, res) => {
    try {
        const { category, type, division, name, status, latitude, longitude, description, image, url } = req.body;
        
        if (!category || !type || !division || !name || !status || !description) {
            return res.status(400).json({ message: "Missing required fields.", success: false });
        }
    
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
        return res.status(201).json({ message: "Location added successfully", success: true, newLocation });
    } catch (error) {
        console.error("An error occured while trying to create new location:", error);
        return res.status(500).json({ message: "An error occured while trying to create new location", success: false})
    }
}

export const removeLocation = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Location ID is required.", success: false });
        }

        await locationModel.findByIdAndDelete(id);

        return res.status(200).json({ message: "Location removed successfully", success: true });
    } catch (error) {
        console.error("An error occured while trying to delete this location:", error)
        return res.status(500).json({ message: "An error occured while trying to delete this location", success: false });
    }
}

export const updateLocation = async (req, res) => {
    try {
        const { id, category, type, division, name, status, latitude, longitude, description, image, url } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Location ID is required for update.", success: false });
        }

        const updateFields = {};
        if (category !== undefined) updateFields.category = category;
        if (type !== undefined) updateFields.type = type;
        if (division !== undefined) updateFields.division = division;
        if (name !== undefined) updateFields.name = name;
        if (status !== undefined) updateFields.status = status;
        if (latitude !== undefined) updateFields.latitude = latitude;
        if (longitude !== undefined) updateFields.longitude = longitude;
        if (description !== undefined) updateFields.description = description;
        if (image !== undefined) updateFields.image = image;
        if (url !== undefined) updateFields.url = url;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: "No fields to update provided.", success: false });
        }

        const updatedLocation = await locationModel.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        console.log("Location updated:", updatedLocation);
        return res.status(200).json({ message: "Location updated successfully", success: true, updatedLocation });
    } catch (error) {
        console.error("An error occured while trying to update this location:", error);
        return res.status(500).json({ message: "An error occured while trying to update this location", success: false });
    }
}