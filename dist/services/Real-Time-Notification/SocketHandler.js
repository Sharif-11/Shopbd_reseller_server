"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSocketHandler = void 0;
class NotificationSocketHandler {
    constructor(io, notificationService) {
        this.io = io;
        this.notificationService = notificationService;
        this.setupSocketHandlers();
    }
    /**
     * Setup socket connection handlers and event listeners
     */
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);
            // Handle user identification when they connect
            socket.on('identify', (authData) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleUserIdentification(socket, authData);
            }));
            // Handle marking notifications as read
            socket.on('mark_as_read', (data) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleMarkAsRead(socket, data.notificationId);
            }));
            // Handle requesting all notifications
            socket.on('get_all_notifications', () => __awaiter(this, void 0, void 0, function* () {
                yield this.handleGetAllNotifications(socket);
            }));
            // Handle requesting unread notifications
            socket.on('get_unread_notifications', () => __awaiter(this, void 0, void 0, function* () {
                yield this.handleGetUnreadNotifications(socket);
            }));
            // Handle requesting notifications by type
            socket.on('get_notifications_by_type', (type) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleGetNotificationsByType(socket, type);
            }));
            // Handle disconnect
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
            // Handle errors
            socket.on('error', error => {
                console.error(`Socket error from ${socket.id}:`, error);
            });
        });
    }
    /**
     * Handle user identification (no authentication, just register userId)
     */
    handleUserIdentification(socket, authData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = authData;
                // Validate user ID
                if (!userId) {
                    socket.emit('identification_error', { message: 'User ID is required' });
                    return;
                }
                // Register user with notification service
                yield this.notificationService.userConnected(userId, socket);
                // Send success response
                socket.emit('identified', {
                    success: true,
                    userId,
                });
                console.log(`User ${userId} identified on socket ${socket.id}`);
                // Store user info in socket for later use
                socket.data.userId = userId;
                // Send initial unread count
                const unreadCount = (yield this.notificationService.getUnreadNotifications(userId)).length;
                socket.emit('unread_count', unreadCount);
            }
            catch (error) {
                console.error('User identification error:', error);
                socket.emit('identification_error', {
                    message: 'Identification failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    }
    /**
     * Handle marking a notification as read
     */
    handleMarkAsRead(socket, notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = socket.data.userId;
                if (!userId) {
                    socket.emit('error', { message: 'User not identified' });
                    return;
                }
                const success = yield this.notificationService.markAsRead(notificationId, userId);
                if (success) {
                    socket.emit('mark_as_read_success', { notificationId });
                    // Send updated unread count
                    const unreadCount = (yield this.notificationService.getUnreadNotifications(userId)).length;
                    socket.emit('unread_count', unreadCount);
                }
                else {
                    socket.emit('mark_as_read_error', {
                        notificationId,
                        message: 'Notification not found or expired',
                    });
                }
            }
            catch (error) {
                console.error('Error marking notification as read:', error);
                socket.emit('error', {
                    message: 'Failed to mark notification as read',
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Handle request for all user notifications
     */
    handleGetAllNotifications(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = socket.data.userId;
                if (!userId) {
                    socket.emit('error', { message: 'User not identified' });
                    return;
                }
                const notifications = yield this.notificationService.getUserNotifications(userId);
                socket.emit('all_notifications', notifications);
            }
            catch (error) {
                console.error('Error getting all notifications:', error);
                socket.emit('error', {
                    message: 'Failed to retrieve notifications',
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Handle request for unread notifications only
     */
    handleGetUnreadNotifications(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = socket.data.userId;
                if (!userId) {
                    socket.emit('error', { message: 'User not identified' });
                    return;
                }
                const unreadNotifications = yield this.notificationService.getUnreadNotifications(userId);
                socket.emit('unread_notifications', unreadNotifications);
            }
            catch (error) {
                console.error('Error getting unread notifications:', error);
                socket.emit('error', {
                    message: 'Failed to retrieve unread notifications',
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Handle request for notifications by type
     */
    handleGetNotificationsByType(socket, type) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = socket.data.userId;
                if (!userId) {
                    socket.emit('error', { message: 'User not identified' });
                    return;
                }
                const userNotifications = yield this.notificationService.getUserNotifications(userId);
                const filteredNotifications = userNotifications.filter(notification => notification.type === type);
                socket.emit('notifications_by_type', {
                    type,
                    notifications: filteredNotifications,
                });
            }
            catch (error) {
                console.error('Error getting notifications by type:', error);
                socket.emit('error', {
                    message: 'Failed to retrieve notifications by type',
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Handle user disconnect
     */
    handleDisconnect(socket) {
        const userId = socket.data.userId;
        if (userId) {
            this.notificationService.userDisconnected(userId);
            console.log(`User ${userId} disconnected from socket ${socket.id}`);
        }
        else {
            console.log(`Unknown user disconnected from socket ${socket.id}`);
        }
    }
    /**
     * Broadcast notification to specific users
     */
    sendNotificationToUsers(notificationData, targetUserIds, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            const notificationId = yield this.notificationService.addNotification(notificationData, targetUserIds, ttl);
            return notificationId;
        });
    }
    /**
     * Send notification to all connected users
     */
    broadcastNotification(notificationData, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get all connected user IDs
            const connectedUserIds = Array.from(this.notificationService['connectedUsers'].keys());
            if (connectedUserIds.length === 0) {
                throw new Error('No connected users to broadcast to');
            }
            const notificationId = yield this.notificationService.addNotification(notificationData, connectedUserIds, ttl);
            return notificationId;
        });
    }
    /**
     * Remove notification by ID
     */
    removeNotification(notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.notificationService.removeNotification(notificationId);
        });
    }
    /**
     * Get notification statistics
     */
    getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.notificationService.getStats();
        });
    }
    /**
     * Update notification TTL
     */
    updateNotificationTTL(notificationId, newTTL) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.notificationService.updateNotificationTTL(notificationId, newTTL);
        });
    }
    /**
     * Extend notification TTL
     */
    extendNotificationTTL(notificationId, additionalTime) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.notificationService.extendNotificationTTL(notificationId, additionalTime);
        });
    }
    /**
     * Set default TTL for new notifications
     */
    setDefaultTTL(ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.notificationService.setDefaultTTL(ttl);
        });
    }
    /**
     * Cleanup resources
     */
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.notificationService.destroy();
        });
    }
}
exports.NotificationSocketHandler = NotificationSocketHandler;
