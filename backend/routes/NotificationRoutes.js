import { Router } from "express";
import { verifyJWT, checkRole } from "../middleware/AuthMiddleware.js";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications
} from "../controllers/NotificationController.js";

const notificationRouter = Router();

// All notification routes require authentication
notificationRouter.use(verifyJWT);

// Get notifications for the current user
notificationRouter.get("/", getNotifications);

// Get unread notification count
notificationRouter.get("/unread-count", getUnreadCount);

// Mark a notification as read
notificationRouter.patch("/:id/read", markAsRead);

// Mark all notifications as read
notificationRouter.patch("/mark-all-read", markAllAsRead);

// Delete a notification
notificationRouter.delete("/:id", deleteNotification);

// Clear all read notifications
notificationRouter.delete("/clear-read", clearReadNotifications);

export default notificationRouter;