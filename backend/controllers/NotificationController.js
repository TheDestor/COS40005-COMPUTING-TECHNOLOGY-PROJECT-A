import { notificationModel } from '../models/NotificationModel.js';

// Create a new notification (internal helper function)
export const createNotification = async (notificationData) => {
    try {
        const notification = await notificationModel.create(notificationData);
        console.log('Notification created:', notification);
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Get notifications for the authenticated user (based on role)
export const getNotifications = async (req, res) => {
    try {
        const userRole = req.role;
        const userId = req.user;
        
        // Build query based on user role
        const query = {
            $or: [
                { targetRole: userRole },
                { targetRole: 'all' },
                { targetUserId: userId }
            ]
        };
        
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        
        // Filter by read status if specified
        if (req.query.read !== undefined) {
            query.read = req.query.read === 'true';
        }
        
        // Fetch notifications with pagination
        const notifications = await notificationModel
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        // Get total count for pagination
        const total = await notificationModel.countDocuments(query);
        
        // Get unread count
        const unreadCount = await notificationModel.countDocuments({
            ...query,
            read: false
        });
        
        res.status(200).json({
            success: true,
            data: notifications,
            count: notifications.length,
            total,
            unreadCount,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
    try {
        const userRole = req.role;
        const userId = req.user;
        
        const count = await notificationModel.countDocuments({
            $or: [
                { targetRole: userRole },
                { targetRole: 'all' },
                { targetUserId: userId }
            ],
            read: false
        });
        
        res.status(200).json({
            success: true,
            unreadCount: count
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count',
            error: error.message
        });
    }
};

// Mark a notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        
        const notification = await notificationModel.findByIdAndUpdate(
            id,
            { read: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
};

// Mark all notifications as read for the current user
export const markAllAsRead = async (req, res) => {
    try {
        const userRole = req.role;
        const userId = req.user;
        
        const result = await notificationModel.updateMany(
            {
                $or: [
                    { targetRole: userRole },
                    { targetRole: 'all' },
                    { targetUserId: userId }
                ],
                read: false
            },
            { read: true }
        );
        
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        
        const notification = await notificationModel.findByIdAndDelete(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
};

// Clear all read notifications for the current user
export const clearReadNotifications = async (req, res) => {
    try {
        const userRole = req.role;
        const userId = req.user;
        
        const result = await notificationModel.deleteMany({
            $or: [
                { targetRole: userRole },
                { targetRole: 'all' },
                { targetUserId: userId }
            ],
            read: true
        });
        
        res.status(200).json({
            success: true,
            message: 'Read notifications cleared',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error clearing read notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear read notifications',
            error: error.message
        });
    }
};