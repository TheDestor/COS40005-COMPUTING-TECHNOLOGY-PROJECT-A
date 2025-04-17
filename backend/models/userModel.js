import mongoose from "mongoose";

export const userRoles = ['tourist', 'business', 'cbt_admin', "system_admin"];
const baseOptions = {
    discriminatorKey: 'role',
    collection: 'users',
    timestamps: true
}

// Base user schema
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
        type: String,
        unique: true,
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
    phoneNumber: { type: String, required: true }, // Haven't done for phone number yet
    password: { type: String, required: true },
    role: { type: String, required: true, enum: userRoles, default: 'tourist' },
}, baseOptions);

export const userModel = mongoose.models.user || mongoose.model('users', userSchema);

// Business user schema with business user specific fields
const businessUserSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    companyRegistrationNo: { type: String, required: true },
    companyAddress: { type: String, required: true },
})

const touristUserSchema = new mongoose.Schema({});

export const businessUserModel = userModel.discriminator('business', businessUserSchema);
export const touristUserModel = userModel.discriminator('tourist', touristUserSchema);