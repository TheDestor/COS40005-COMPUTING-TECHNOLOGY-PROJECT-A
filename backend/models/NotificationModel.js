import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    // Type of notification
    type: {
        type: String,
        required: true,
        enum: ['business_submission', 'business_approved', 'business_rejected', 'business_updated', 'business_deleted', 'inquiry_submission'],
        default: 'business_submission'
    },
    
    // Message content
    message: {
        type: String,
        required: true,
        trim: true
    },
    
    // Reference to the business (if applicable)
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'businesses',
        default: null
    },
    
    // Business name for quick reference
    businessName: {
        type: String,
        trim: true,
        default: null
    },
    
    // Owner name for quick reference
    ownerName: {
        type: String,
        trim: true,
        default: null
    },
    
    // Who should see this notification (role-based)
    targetRole: {
        type: String,
        required: true,
        enum: ['cbt_admin', 'business', 'tourist', 'system_admin', 'all'],
        default: 'cbt_admin'
    },
    
    // Specific user ID if notification is for a specific user
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    
    // Read status
    read: {
        type: Boolean,
        default: false
    },
    
    // Priority level
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },
    
    // Metadata for additional context
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Timestamp
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true 
});

// Indexes for better query performance
notificationSchema.index({ targetRole: 1, read: 1, createdAt: -1 });
notificationSchema.index({ targetUserId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ businessId: 1 });
notificationSchema.index({ createdAt: -1 });

// Auto-delete old notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const notificationModel = mongoose.model('notifications', notificationSchema);