import mongoose from "mongoose";

export const userRoles = ['tourist', 'business', 'cbt_admin', "system_admin"];
const baseOptions = {
    discriminatorKey: 'role',
    collection: 'users',
    timestamps: true
}

// Temporary testing schema
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: userRoles, default: 'tourist' },
}, baseOptions);

export const userModel = mongoose.models.user || mongoose.model('users', userSchema);

const businessUserSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    companyRegistrationNo: { type: String, required: true },
    companyAddress: { type: String, required: true },
})

const touristUserSchema = new mongoose.Schema({});

export const businessUserModel = userModel.discriminator('business', businessUserSchema);
export const touristUserModel = userModel.discriminator('tourist', touristUserSchema);