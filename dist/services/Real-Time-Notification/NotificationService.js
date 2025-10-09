"use strict";
// NotificationService.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../../config"));
const PersistentFIFOQueue_1 = require("./PersistentFIFOQueue");
class NotificationService {
    constructor({ maxQueueSize = 1000, defaultTTL = 24 * 60 * 60 * 1000, }) {
        this.connectedUsers = new Map();
        this.userNotifications = new Map();
        this.notificationQueue = new PersistentFIFOQueue_1.PersistentFIFOQueue({
            maxSize: maxQueueSize,
            persistenceKey: 'notification_queue',
            autoSave: true,
            saveInterval: 3000,
            defaultTTL: defaultTTL, // 1 day default
        });
        // Clean up user notifications mapping when items expire
        this.setupExpirationCleanup();
    }
    /**
     * Add a new notification with optional TTL
     */
    addNotification(data, targetUserIds, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            const notificationId = (0, uuid_1.v4)();
            const now = new Date();
            const notification = Object.assign(Object.assign({ notificationId }, data), { targetUserIds, readBy: [], isDelivered: false, createdAt: now, updatedAt: now });
            yield this.notificationQueue.enqueue(notificationId, notification, undefined, ttl);
            // Update user notifications mapping
            targetUserIds.forEach(userId => {
                if (!this.userNotifications.has(userId)) {
                    this.userNotifications.set(userId, new Set());
                }
                this.userNotifications.get(userId).add(notificationId);
            });
            // Send real-time notification to connected users
            yield this.sendRealTimeNotification(notification);
            return notificationId;
        });
    }
    /**
     * Setup cleanup for expired notifications
     */
    setupExpirationCleanup() {
        // The queue auto-cleans expired items, but we need to clean our mappings
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredMappings().catch(error => {
                console.error('Error cleaning up expired mappings:', error);
            });
        }, 60000); // Check every minute
    }
    /**
     * Clean up user notifications mapping for expired items
     */
    cleanupExpiredMappings() {
        return __awaiter(this, void 0, void 0, function* () {
            const expiredNotifications = new Set();
            // Check all tracked notifications and remove expired ones from mappings
            this.userNotifications.forEach((notificationIds, userId) => {
                notificationIds.forEach(notificationId => {
                    if (this.notificationQueue.isExpired(notificationId)) {
                        expiredNotifications.add(notificationId);
                        notificationIds.delete(notificationId);
                    }
                });
                // Remove user entry if no notifications left
                if (notificationIds.size === 0) {
                    this.userNotifications.delete(userId);
                }
            });
            if (expiredNotifications.size > 0) {
                console.log(`Cleaned up ${expiredNotifications.size} expired notification mappings`);
            }
        });
    }
    /**
     * Get all non-expired notifications for a user
     */
    getUserNotifications(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.cleanupExpiredMappings();
            const userNotificationIds = this.userNotifications.get(userId) || new Set();
            const notifications = [];
            for (const notificationId of userNotificationIds) {
                const queueItem = this.notificationQueue.getById(notificationId);
                if (queueItem) {
                    notifications.push(queueItem.data);
                }
            }
            // Sort by creation date, newest first
            return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
    }
    /**
     * Get unread notifications for a user (non-expired only)
     */
    getUnreadNotifications(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const userNotifications = yield this.getUserNotifications(userId);
            return userNotifications.filter(notification => !notification.readBy.includes(userId));
        });
    }
    /**
     * Mark notification as read by user (only if not expired)
     */
    markAsRead(notificationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const success = yield this.notificationQueue.updateById(notificationId, item => {
                const notification = Object.assign({}, item.data);
                if (!notification.readBy.includes(userId)) {
                    notification.readBy.push(userId);
                    notification.updatedAt = new Date();
                }
                return Object.assign(Object.assign({}, item), { data: notification });
            });
            if (success) {
                // Update unread count for connected user
                const user = this.connectedUsers.get(userId);
                if (user) {
                    const unreadCount = (yield this.getUnreadNotifications(userId)).length;
                    user.socket.emit('unread_count', unreadCount);
                }
            }
            return success;
        });
    }
    /**
     * Mark notification as delivered (only if not expired)
     */
    markAsDelivered(notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.notificationQueue.updateById(notificationId, item => {
                const notification = Object.assign({}, item.data);
                if (!notification.isDelivered) {
                    notification.isDelivered = true;
                    notification.deliveredAt = new Date();
                    notification.updatedAt = new Date();
                }
                return Object.assign(Object.assign({}, item), { data: notification });
            });
        });
    }
    /**
     * Extend TTL for a notification
     */
    extendNotificationTTL(notificationId, additionalTime) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.notificationQueue.extendTTL(notificationId, additionalTime);
        });
    }
    /**
     * Update TTL for a notification
     */
    updateNotificationTTL(notificationId, newTTL) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.notificationQueue.updateTTL(notificationId, newTTL);
        });
    }
    /**
     * Get time until notification expires
     */
    getTimeUntilExpiry(notificationId) {
        return this.notificationQueue.getTimeUntilExpiry(notificationId);
    }
    /**
     * User connects via socket
     */
    userConnected(userId, socket) {
        return __awaiter(this, void 0, void 0, function* () {
            this.connectedUsers.set(userId, { userId, socket });
            // Send all non-expired user notifications on connection
            const userNotifications = yield this.getUserNotifications(userId);
            socket.emit('all_notifications', userNotifications);
            // Send unread count
            const unreadCount = (yield this.getUnreadNotifications(userId)).length;
            socket.emit('unread_count', unreadCount);
        });
    }
    /**
     * User disconnects
     */
    userDisconnected(userId) {
        this.connectedUsers.delete(userId);
    }
    /**
     * Send real-time notification to target users
     */
    sendRealTimeNotification(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = notification.targetUserIds.map((userId) => __awaiter(this, void 0, void 0, function* () {
                const user = this.connectedUsers.get(userId);
                if (user) {
                    user.socket.emit('new_notification', notification);
                    // Update unread count
                    const unreadCount = (yield this.getUnreadNotifications(userId)).length;
                    user.socket.emit('unread_count', unreadCount);
                }
            }));
            yield Promise.all(promises);
            // Mark as delivered for connected users
            const connectedTargetUsers = notification.targetUserIds.filter(userId => this.connectedUsers.has(userId));
            if (connectedTargetUsers.length > 0) {
                yield this.markAsDelivered(notification.notificationId);
            }
        });
    }
    /**
     * Get notifications by type (non-expired only)
     */
    getNotificationsByType(type) {
        return __awaiter(this, void 0, void 0, function* () {
            const allItems = this.notificationQueue.getAll();
            return allItems
                .filter(item => item.data.type === type)
                .map(item => item.data)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
    }
    /**
     * Get queue statistics including TTL info
     */
    getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const expiredCount = this.notificationQueue.getExpiredCount();
            const totalCount = this.notificationQueue.totalSize();
            return {
                totalNotifications: this.notificationQueue.size(),
                expiredNotifications: expiredCount,
                totalIncludingExpired: totalCount,
                connectedUsers: this.connectedUsers.size,
                userNotificationMappings: this.userNotifications.size,
                defaultTTL: this.notificationQueue.getDefaultTTL(),
            };
        });
    }
    /**
     * Set default TTL for new notifications
     */
    setDefaultTTL(ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.notificationQueue.setDefaultTTL(ttl);
        });
    }
    /**
     * Remove notification by ID (regardless of expiration)
     */
    removeNotification(notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const success = yield this.notificationQueue.removeById(notificationId);
            if (success) {
                // Clean up from user mappings
                this.userNotifications.forEach((notificationIds, userId) => {
                    if (notificationIds.has(notificationId)) {
                        notificationIds.delete(notificationId);
                        if (notificationIds.size === 0) {
                            this.userNotifications.delete(userId);
                        }
                    }
                });
            }
            return success;
        });
    }
    /**
     * Cleanup resources
     */
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
            }
            yield this.notificationQueue.destroy();
            this.connectedUsers.clear();
            this.userNotifications.clear();
        });
    }
}
exports.NotificationService = NotificationService;
// Create singleton instance
exports.notificationService = new NotificationService({
    maxQueueSize: 10,
    defaultTTL: config_1.default.ttlForNotification || 24 * 60 * 60 * 1000, // 1 day
});
