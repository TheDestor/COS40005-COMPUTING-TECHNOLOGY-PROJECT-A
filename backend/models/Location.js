import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
    category: { type: String, trim: true },
    type: { type: String, trim: true },
    divison: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true, trim: true },
    longitude: { type: Number, required: true, trim: true },
    url: { type: String, trim: true }
});

export const locationModel = mongoose.model('locations', locationSchema);