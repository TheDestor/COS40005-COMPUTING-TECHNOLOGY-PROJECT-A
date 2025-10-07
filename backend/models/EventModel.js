import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    targetAudience: [{ type: String }],
    registrationRequired: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    eventType: { type: String, required: true },
    imageUrl: { type: String, default: null },
    coordinates: {
        latitude: { type: Number, default: 1.5533 },
        longitude: { type: Number, default: 110.3592 }
    },
    eventOrganizers: { type: String, default: '' },
    eventHashtags: [{ type: String }]
}, {
    timestamps: true
});

export const eventModel = mongoose.model('events', eventSchema);