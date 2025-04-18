import mongoose from "mongoose";

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  firebaseUid: { type: String, required: true },
});

module.exports = mongoose.model("User", userSchema);
