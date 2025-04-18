import mongoose from "mongoose";

const baseOptions = {
    collection: 'contactUs',
    timestamps: true
}

const contactUsSchema = new mongoose.Schema({
    email: {
        type: String,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v); // Make sure the email is formatted correctly
            },
            message: "Please enter a valid email"
        },
        required: [true, "Email required"]
    },
    category: { type: String, required: true },
    topic: { type: String, required: true },
    message: { type: String, required: true },
}, baseOptions);

export const contactUsModel = mongoose.model('contactUs', contactUsSchema);