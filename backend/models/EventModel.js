import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, required: true },
    targetAudience: [{ type: String }],
    registrationRequired: { type: String, required: true },
    eventDate: { type: Date, required: true },
    eventType: { type: String, required: true },
    imageUrl: { type: String, default: null }
});

export const eventModel = mongoose.model('events', eventSchema);