import { put } from "@vercel/blob";
import { eventModel } from "../models/EventModel.js";

export const getAllEvents = async (req, res) => {
    try {
        const { eventType } = req.query;
        const filter = eventType ? { eventType } : {};
        
        const events = await eventModel.find(filter).exec();

        if (!events.length) {
            return res.status(404).json({ message: "No events found", success: false });
        }

        return res.status(200).json({ 
            message: "Events fetched successfully", 
            success: true, 
            events 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            message: "An error occurred while fetching events", 
            success: false 
        });
    }
}

export const addEvent = async (req, res) => {
    try {
        const { name, description, location, eventType, targetAudience, registrationRequired, date } = req.body;
        const imageFile = req.file;

        console.log(req.body);
        console.log(imageFile);
        
        if (!name || !description || !location || !eventType || !targetAudience || !registrationRequired || !date || !imageFile) {
            return res.status(400).json({ message: "All fields must be filled in", success: false });
        }

        let blob;
        try {
            blob = await put(
                imageFile.originalname,
                imageFile.buffer,
                {
                    access: 'public',
                    addRandomSuffix: true,
                    token: process.env.BLOB_READ_WRITE_TOKEN
                }
            );
        } catch (uploadError) {
            console.error("Error uploading to Vercel Blob:", uploadError);
            return res.status(500).json({ message: "Failed to upload image to storage.", success: false });
        }

        let parsedTargetAudience;
        try {
            parsedTargetAudience = JSON.parse(targetAudience);
        } catch (parseError) {
            console.error("Error parsing targetAudience:", parseError);

            return res.status(400).json({ message: "Invalid format for targetAudience.", success: false });
        }

        const newEventData = {
            name,
            description,
            location,
            targetAudience: parsedTargetAudience,
            registrationRequired,
            eventDate: date,
            eventType,
            imageUrl: blob.url
        }
        const event = await eventModel.create(newEventData);
        console.log(event);
        return res.status(201).json({ message: "Event added successfully", success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error has occured while trying to add new event", success: false });
    }
}