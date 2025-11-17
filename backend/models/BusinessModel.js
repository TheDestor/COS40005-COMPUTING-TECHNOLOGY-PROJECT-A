import mongoose from "mongoose";

const businessSchema = new mongoose.Schema({
    // Basic Information
    name: { type: String, required: true, trim: true },
    owner: { type: String, required: true, trim: true },
    ownerEmail: { type: String, required: true, trim: true },

    // Business Details
    description: { type: String, required: true, trim: true, minlength: 50 },
    category: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    website: { type: String, trim: true, default: null },
    openingHours: { type: String, trim: true, default: null },
    latitude: { type: Number, required: true, trim: true },
    longitude: { type: Number, required: true, trim: true },
  
    // Who submitted (not necessarily the business email)
    submitterUserId: { type: String, index: true, default: null },
    submitterEmail: { type: String, trim: true, default: null },

    // Media
    businessImage: { type: String, required: true },  // URL to stored image
    ownerAvatar: { type: String, required: true },    // URL to stored image

    // Submission Details
    submissionDate: { type: Date, default: Date.now },
    status: { 
        type: String, 
        required: true, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    priority: { 
        type: String, 
        required: true, 
        enum: ['high', 'medium', 'low'], 
        default: 'low' 
    },
    // Admin feedback notes
    adminNotes: { 
        type: String, 
        trim: true, 
        default: null 
    },

    // Agreement
    agreement: { type: Boolean, required: true, default: false }
}, { timestamps: true });

// Add index for better query performance
businessSchema.index({ category: 1 });
businessSchema.index({ status: 1 });
businessSchema.index({ priority: 1 });
businessSchema.index({ submissionDate: -1 });
businessSchema.index({ ownerEmail: 1 });

export const businessModel = mongoose.model('businesses', businessSchema);