import mongoose from "mongoose";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";

const keyLength = 32;
// Password hashing function
const hash = async (password) => {
    return new Promise((resolve, reject) => {
        const salt = randomBytes(16).toString("hex");

        scrypt(password, salt, keyLength, (error, derivedKey) => {
            if (error) reject(error);
            resolve(`${salt}.${derivedKey.toString("hex")}`);
        });
    })
};

// Compare password hash
const compare = async (password, hash) => {
    return new Promise((resolve, reject) => {
        const [salt, hashKey] = hash.split(".");
        const hashKeyBuffer = Buffer.from(hashKey, "hex");
        scrypt(password, salt, keyLength, (error, derivedKey) => {
            if (error) reject(error);
            resolve(timingSafeEqual(hashKeyBuffer, derivedKey));
        })
    })
}

export const userRoles = ['tourist', 'business', 'cbt_admin', "system_admin"];
const baseOptions = {
    discriminatorKey: 'role',
    collection: 'users',
    timestamps: true
}

// Base user schema
// userSchema (add provider flag)
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
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
    // phoneNumber: { type: String, required: true, trim: true }, 
    phoneNumber: { type: String, trim: true, default: null },
    password: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: userRoles, default: 'tourist' },
    nationality: { type: String, required: true, default: 'N/A' },
    avatarUrl: { type: String, default: null},
    authProvider: { type: String, enum: ['password','google'], default: 'password' },
    // Add account status for admin breakdowns
    accountStatus: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null }
}, baseOptions);

userSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) return next();
        const hashedPassword = await hash(this.password);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.isValidPassword = async function (password) {
    try {
        return await compare(password, this.password);
    } catch (error) {
        throw new Error("Password comparison failed");
    }
};

export const userModel = mongoose.models.user || mongoose.model('users', userSchema);

// Business user schema with business user specific fields
const businessUserSchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true },
    companyRegistrationNo: { type: String, required: true, trim: true },
    companyAddress: { type: String, required: true, trim: true },
})

const touristUserSchema = new mongoose.Schema({});

export const businessUserModel = userModel.discriminator('business', businessUserSchema);
export const touristUserModel = userModel.discriminator('tourist', touristUserSchema);