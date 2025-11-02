import { put, del } from "@vercel/blob";
import { eventModel } from "../models/EventModel.js";
import { userModel } from "../models/UserModel.js";
import transporter from "../config/emailConfig.js";
import { getNewEventEmailTemplate } from "../utils/emailTemplates.js";

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
        const { name, description, eventType, targetAudience, registrationRequired, startDate, endDate, startTime, endTime, latitude, longitude, eventOrganizers, eventHashtags, dailySchedule } = req.body;
        const imageFile = req.file;

        console.log('Request body:', req.body);
        console.log('Image file:', imageFile);
        
        // Remove unconditional uniform time requirement; allow advanced schedule
        if (!name || !description || !eventType || !targetAudience || !registrationRequired || !startDate || !endDate) {
            return res.status(400).json({ message: "All fields must be filled in", success: false });
        }

        if (!imageFile) {
            return res.status(400).json({ message: "Event image is required", success: false });
        }

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const currentDate = new Date();
        
        // Compare by calendar day (local), not time-of-day
        const pad = (n) => String(n).padStart(2, '0');
        const toYmdLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const startYmd = typeof startDate === 'string' ? startDate.slice(0, 10) : toYmdLocal(startDateObj);
        const endYmd = typeof endDate === 'string' ? endDate.slice(0, 10) : toYmdLocal(endDateObj);
        const todayYmd = toYmdLocal(currentDate);

        if (endYmd < startYmd) {
            return res.status(400).json({ message: "End date cannot be before start date", success: false });
        }
        if (startYmd < todayYmd) {
            return res.status(400).json({ message: "Start date cannot be in the past", success: false });
        }

        // Use token and guard upload with try/catch
        let blob;
        try {
            blob = await put(imageFile.originalname, imageFile.buffer, {
                access: 'public',
                addRandomSuffix: true,
                token: process.env.BLOB_READ_WRITE_TOKEN
            });
        } catch (uploadErr) {
            console.error("Error uploading image to Vercel Blob:", uploadErr);
            return res.status(500).json({ message: "Image upload failed. Please try again.", success: false });
        }

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

        // Parse dailySchedule
        let parsedDailySchedule = null;
        if (dailySchedule) {
            try {
                const ds = JSON.parse(dailySchedule);
                if (Array.isArray(ds) && ds.length > 0) {
                    const timeRegex = /^\d{2}:\d{2}$/;
                    parsedDailySchedule = ds.map(entry => {
                        if (!entry?.date || !entry?.startTime || !entry?.endTime) {
                            throw new Error('Invalid dailySchedule entry');
                        }
                        if (!timeRegex.test(entry.startTime) || !timeRegex.test(entry.endTime)) {
                            throw new Error('dailySchedule times must be HH:MM');
                        }
                        const d = new Date(entry.date);
                        if (isNaN(d.getTime())) throw new Error('Invalid dailySchedule date');
                        return { date: d, startTime: entry.startTime, endTime: entry.endTime };
                    });
                }
            } catch (e) {
                return res.status(400).json({ message: "Invalid format for dailySchedule.", success: false });
            }
        }

        // Accept either uniform or advanced
        const timeRegex = /^\d{2}:\d{2}$/;
        const hasUniformTimes = Boolean(startTime && endTime && timeRegex.test(startTime) && timeRegex.test(endTime));
        const hasAdvancedSchedule = Array.isArray(parsedDailySchedule) && parsedDailySchedule.length > 0;

        if (!hasUniformTimes && !hasAdvancedSchedule) {
            return res.status(400).json({ message: "Provide either uniform start/end time or a valid daily schedule.", success: false });
        }

        const newEventData = {
            name,
            description,
            targetAudience: parsedTargetAudience,
            registrationRequired,
            startDate: startDateObj,
            endDate: endDateObj,
            eventType,
            imageUrl: blob.url,
            coordinates: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            },
            eventOrganizers: eventOrganizers || '',
            eventHashtags: hashtagsArray
        };

        if (hasAdvancedSchedule) {
            newEventData.dailySchedule = parsedDailySchedule;
            // Also store global times if provided (optional)
            if (hasUniformTimes) {
                const isSameDay = startDateObj.toDateString() === endDateObj.toDateString();
                const finalEndTime = isSameDay && !endTime ? '23:59' : endTime;
                newEventData.startTime = startTime;
                newEventData.endTime = finalEndTime;
            }
        } else {
            // Uniform mode: store global times only
            const isSameDay = startDateObj.toDateString() === endDateObj.toDateString();
            const finalEndTime = isSameDay && !endTime ? '23:59' : endTime;
            newEventData.startTime = startTime;
            newEventData.endTime = finalEndTime;
        }

        const event = await eventModel.create(newEventData);
        console.log('Event created successfully:', event);

        try {
            const usersToNotify = await userModel.find({ "notifications.event": true }).select("email firstName lastName");

            if (usersToNotify.length > 0) {
                console.log(`Attempting to send notifications to ${usersToNotify.length} user(s).`);
                for (const user of usersToNotify) {
                    const fullName = `${user.firstName} ${user.lastName}`;
                    const emailTemplate = getNewEventEmailTemplate(newEventData.name, fullName, newEventData.description, newEventData.eventOrganizers, newEventData.eventType, newEventData.eventHashtags, newEventData.startDate);
                    const mailOptions = {
                        to: user.email,
                        from: `"Sarawak Tourism 🌴" <${process.env.EMAIL_USER}>`,
                        subject: emailTemplate.subject,
                        html: emailTemplate.html,
                        text: emailTemplate.text
                    };
                    await transporter.sendMail(mailOptions);
                }
                console.log("Finished sending notification emails.");
            }
        } catch (emailError) {
            console.error("The event was created, but failed to send notification emails.", emailError);
        }

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
        const { name, description, eventType, targetAudience, registrationRequired, startDate, endDate, startTime, endTime, latitude, longitude, eventOrganizers, eventHashtags, dailySchedule } = req.body;
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

        // Parse dailySchedule if provided
        let parsedDailySchedule = null;
        if (dailySchedule) {
            try {
                const ds = JSON.parse(dailySchedule);
                if (Array.isArray(ds) && ds.length > 0) {
                    const timeRegex = /^\d{2}:\d{2}$/;
                    parsedDailySchedule = ds.map(entry => {
                        if (!entry?.date || !entry?.startTime || !entry?.endTime) {
                            throw new Error('Invalid dailySchedule entry');
                        }
                        if (!timeRegex.test(entry.startTime) || !timeRegex.test(entry.endTime)) {
                            throw new Error('dailySchedule times must be HH:MM');
                        }
                        const d = new Date(entry.date);
                        if (isNaN(d.getTime())) throw new Error('Invalid dailySchedule date');
                        return { date: d, startTime: entry.startTime, endTime: entry.endTime };
                    });
                    updateData.dailySchedule = parsedDailySchedule;
                } else {
                    updateData.dailySchedule = [];
                }
            } catch (e) {
                return res.status(400).json({ message: "Invalid format for dailySchedule.", success: false });
            }
        }

        // Decide uniform vs advanced
        const timeRegex = /^\d{2}:\d{2}$/;
        const hasUniformTimes = Boolean(startTime && endTime && timeRegex.test(startTime) && timeRegex.test(endTime));
        const hasAdvancedSchedule = Array.isArray(updateData.dailySchedule) && updateData.dailySchedule.length > 0;

        if (hasAdvancedSchedule) {
            // Advanced mode: keep per-day; also store global times if provided
            if (hasUniformTimes) {
                updateData.startTime = startTime;
                updateData.endTime = endTime;
            }
        } else if (hasUniformTimes) {
            // Uniform mode: set global times
            updateData.startTime = startTime;
            updateData.endTime = endTime;
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