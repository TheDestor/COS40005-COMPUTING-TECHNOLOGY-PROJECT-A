import { put, del } from "@vercel/blob";
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
        console.error("Error fetching events:", error);
        return res.status(500).json({ 
            message: "An error occurred while fetching events", 
            success: false 
        });
    }
}

export const addEvent = async (req, res) => {
    try {
        const { name, description, eventType, targetAudience, registrationRequired, startDate, endDate, startTime, endTime, latitude, longitude, eventOrganizers, eventHashtags } = req.body;
        const imageFile = req.file;

        console.log('Request body:', req.body);
        console.log('Image file:', imageFile);
        
        if (!name || !description || !eventType || !targetAudience || !registrationRequired || !startDate || !endDate || !startTime || !endTime) {
            return res.status(400).json({ message: "All fields must be filled in", success: false });
        }

        if (!imageFile) {
            return res.status(400).json({ message: "Event image is required", success: false });
        }

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const currentDate = new Date();
        
        if (endDateObj < startDateObj) {
            return res.status(400).json({ message: "End date cannot be before start date", success: false });
        }
        if (startDateObj < currentDate) {
            return res.status(400).json({ message: "Start date cannot be in the past", success: false });
        }

        const blob = await put(imageFile.originalname, imageFile.buffer, {
            access: 'public',
            addRandomSuffix: true,
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        let parsedTargetAudience;
        try {
            parsedTargetAudience = JSON.parse(targetAudience);
        } catch (parseError) {
            console.error("Error parsing targetAudience:", parseError);
            return res.status(400).json({ message: "Invalid format for targetAudience.", success: false });
        }

        const hashtagsArray = (eventHashtags || '')
            .split(',')
            .map(h => h.trim())
            .filter(Boolean);

        let finalEndTime = endTime;
        if (startDateObj.toDateString() === endDateObj.toDateString() && !endTime) {
            finalEndTime = '23:59';
        }

        const newEventData = {
            name,
            description,
            targetAudience: parsedTargetAudience,
            registrationRequired,
            startDate: startDateObj,
            endDate: endDateObj,
            startTime,
            endTime: finalEndTime,
            eventType,
            imageUrl: blob.url,
            coordinates: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            },
            eventOrganizers: eventOrganizers || '',
            eventHashtags: hashtagsArray
        }
        
        const event = await eventModel.create(newEventData);
        console.log('Event created successfully:', event);
        return res.status(201).json({ message: "Event added successfully", success: true, event });
    } catch (error) {
        console.error("Unexpected error in addEvent:", error);
        return res.status(500).json({ 
            message: "An unexpected error occurred. Please try again.", 
            success: false 
        });
    }
}

export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, eventType, targetAudience, registrationRequired, startDate, endDate, startTime, endTime, latitude, longitude, eventOrganizers, eventHashtags } = req.body;
        const imageFile = req.file;

        const existingEvent = await eventModel.findById(id);
        if (!existingEvent) {
            return res.status(404).json({ message: "Event not found", success: false });
        }

        let updateData = {
            name,
            description,
            eventType,
            registrationRequired,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            startTime,
            endTime,
            coordinates: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            },
            eventOrganizers: eventOrganizers || ''
        };

        if (eventHashtags !== undefined) {
            updateData.eventHashtags = (eventHashtags || '')
                .split(',')
                .map(h => h.trim())
                .filter(Boolean);
        }

        if (targetAudience) {
            try {
                updateData.targetAudience = JSON.parse(targetAudience);
            } catch (parseError) {
                console.error("Error parsing targetAudience:", parseError);
                return res.status(400).json({ message: "Invalid format for targetAudience.", success: false });
            }
        }

        if (imageFile) {
            if (existingEvent.imageUrl) {
                try {
                    await del(existingEvent.imageUrl, {
                        token: process.env.BLOB_READ_WRITE_TOKEN
                    });
                } catch (deleteError) {
                    console.error("Error deleting old image from Vercel Blob:", deleteError);
                }
            }

            const blob = await put(imageFile.originalname, imageFile.buffer, {
                access: 'public',
                addRandomSuffix: true,
                token: process.env.BLOB_READ_WRITE_TOKEN
            });
            updateData.imageUrl = blob.url;
        }

        const event = await eventModel.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!event) {
            return res.status(404).json({ message: "Event not found", success: false });
        }

        return res.status(200).json({ message: "Event updated successfully", success: true, event });
    } catch (error) {
        console.error("Error updating event:", error);
        return res.status(500).json({ message: "An error occurred while updating event", success: false });
    }
}

export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await eventModel.findById(id);
        
        if (!event) {
            return res.status(404).json({ message: "Event not found", success: false });
        }

        return res.status(200).json({ message: "Event fetched successfully", success: true, event });
    } catch (error) {
        console.error("Error fetching event:", error);
        return res.status(500).json({ message: "An error occurred while fetching event", success: false });
    }
}

export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await eventModel.findByIdAndDelete(id);
        
        if (!event) {
            return res.status(404).json({ message: "Event not found", success: false });
        }

        if (event.imageUrl) {
            try {
                await del(event.imageUrl, {
                    token: process.env.BLOB_READ_WRITE_TOKEN
                });
            } catch (deleteError) {
                console.error("Error deleting image from Vercel Blob:", deleteError);
            }
        }

        return res.status(200).json({ message: "Event deleted successfully", success: true });
    } catch (error) {
        console.error("Error deleting event:", error);
        return res.status(500).json({ message: "An error occurred while deleting event", success: false });
    }
}