import mongoose from "mongoose";

// Temporary testing schema
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
});

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;