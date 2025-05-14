import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
    id: { type: Number },
    category: { type: String, trim: true },
    type: { type: String, trim: true },
    division: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true, trim: true },
    longitude: { type: Number, required: true, trim: true },
    url: { type: String, trim: true },
    description: {type: String, trim: true },
    image: { type: String, trim: true },
    status: { type: String, trim: true, default: "Active" }
}, {timestamps: true});

export const locationModel = mongoose.model('locations', locationSchema);