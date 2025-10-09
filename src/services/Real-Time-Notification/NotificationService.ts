// NotificationService.ts

import { v4 as uuidv4 } from 'uuid'
import config from '../../config'
import {
  Notification,
  NotificationData,
  NotificationType,
} from './NotificationTypes'
import { PersistentFIFOQueue } from './PersistentFIFOQueue'
import { SocketUser } from './types'

export class NotificationService {
  private notificationQueue: PersistentFIFOQueue<Notification>
  private connectedUsers: Map<string, SocketUser> = new Map()
  private userNotifications: Map<string, Set<string>> = new Map()
  private cleanupInterval?: NodeJS.Timeout

  constructor({
    maxQueueSize = 1000,
    defaultTTL = 24 * 60 * 60 * 1000,
  }: {
    maxQueueSize?: number
    defaultTTL?: number
  }) {
    this.notificationQueue = new PersistentFIFOQueue<Notification>({
      maxSize: maxQueueSize,
      persistenceKey: 'notification_queue',
      autoSave: true,
      saveInterval: 3000,
      defaultTTL: defaultTTL, // 1 day default
    })

    // Clean up user notifications mapping when items expire
    this.setupExpirationCleanup()
  }

  /**
   * Add a new notification with optional TTL
   */
  async addNotification(
    data: NotificationData,
    targetUserIds: string[],
    ttl?: number,
  ): Promise<string> {
    const notificationId = uuidv4()
    const now = new Date()

    const notification: Notification = {
      notificationId,
      ...data,
      targetUserIds,
      readBy: [],
      isDelivered: false,
      createdAt: now,
      updatedAt: now,
    }

    await this.notificationQueue.enqueue(
      notificationId,
      notification,
      undefined,
      ttl,
    )

    // Update user notifications mapping
    targetUserIds.forEach(userId => {
      if (!this.userNotifications.has(userId)) {
        this.userNotifications.set(userId, new Set())
      }
      this.userNotifications.get(userId)!.add(notificationId)
    })

    // Send real-time notification to connected users
    await this.sendRealTimeNotification(notification)

    return notificationId
  }

  /**
   * Setup cleanup for expired notifications
   */
  private setupExpirationCleanup(): void {
    // The queue auto-cleans expired items, but we need to clean our mappings
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredMappings().catch(error => {
        console.error('Error cleaning up expired mappings:', error)
      })
    }, 60000) // Check every minute
  }

  /**
   * Clean up user notifications mapping for expired items
   */
  private async cleanupExpiredMappings(): Promise<void> {
    const expiredNotifications = new Set<string>()

    // Check all tracked notifications and remove expired ones from mappings
    this.userNotifications.forEach((notificationIds, userId) => {
      notificationIds.forEach(notificationId => {
        if (this.notificationQueue.isExpired(notificationId)) {
          expiredNotifications.add(notificationId)
          notificationIds.delete(notificationId)
        }
      })

      // Remove user entry if no notifications left
      if (notificationIds.size === 0) {
        this.userNotifications.delete(userId)
      }
    })

    if (expiredNotifications.size > 0) {
      console.log(
        `Cleaned up ${expiredNotifications.size} expired notification mappings`,
      )
    }
  }

  /**
   * Get all non-expired notifications for a user
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    await this.cleanupExpiredMappings()

    const userNotificationIds = this.userNotifications.get(userId) || new Set()
    const notifications: Notification[] = []

    for (const notificationId of userNotificationIds) {
      const queueItem = this.notificationQueue.getById(notificationId)
      if (queueItem) {
        notifications.push(queueItem.data)
      }
    }

    // Sort by creation date, newest first
    return notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  /**
   * Get unread notifications for a user (non-expired only)
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const userNotifications = await this.getUserNotifications(userId)
    return userNotifications.filter(
      notification => !notification.readBy.includes(userId),
    )
  }

  /**
   * Mark notification as read by user (only if not expired)
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const success = await this.notificationQueue.updateById(
      notificationId,
      item => {
        const notification = { ...item.data }

        if (!notification.readBy.includes(userId)) {
          notification.readBy.push(userId)
          notification.updatedAt = new Date()
        }

        return { ...item, data: notification }
      },
    )

    if (success) {
      // Update unread count for connected user
      const user = this.connectedUsers.get(userId)
      if (user) {
        const unreadCount = (await this.getUnreadNotifications(userId)).length
        user.socket.emit('unread_count', unreadCount)
      }
    }

    return success
  }

  /**
   * Mark notification as delivered (only if not expired)
   */
  async markAsDelivered(notificationId: string): Promise<boolean> {
    return await this.notificationQueue.updateById(notificationId, item => {
      const notification = { ...item.data }

      if (!notification.isDelivered) {
        notification.isDelivered = true
        notification.deliveredAt = new Date()
        notification.updatedAt = new Date()
      }

      return { ...item, data: notification }
    })
  }

  /**
   * Extend TTL for a notification
   */
  async extendNotificationTTL(
    notificationId: string,
    additionalTime: number,
  ): Promise<boolean> {
    return await this.notificationQueue.extendTTL(
      notificationId,
      additionalTime,
    )
  }

  /**
   * Update TTL for a notification
   */
  async updateNotificationTTL(
    notificationId: string,
    newTTL: number,
  ): Promise<boolean> {
    return await this.notificationQueue.updateTTL(notificationId, newTTL)
  }

  /**
   * Get time until notification expires
   */
  getTimeUntilExpiry(notificationId: string): number | null {
    return this.notificationQueue.getTimeUntilExpiry(notificationId)
  }

  /**
   * User connects via socket
   */
  async userConnected(userId: string, socket: any): Promise<void> {
    this.connectedUsers.set(userId, { userId, socket })

    // Send all non-expired user notifications on connection
    const userNotifications = await this.getUserNotifications(userId)
    socket.emit('all_notifications', userNotifications)

    // Send unread count
    const unreadCount = (await this.getUnreadNotifications(userId)).length
    socket.emit('unread_count', unreadCount)
  }

  /**
   * User disconnects
   */
  userDisconnected(userId: string): void {
    this.connectedUsers.delete(userId)
  }

  /**
   * Send real-time notification to target users
   */
  private async sendRealTimeNotification(
    notification: Notification,
  ): Promise<void> {
    const promises = notification.targetUserIds.map(async userId => {
      const user = this.connectedUsers.get(userId)
      if (user) {
        user.socket.emit('new_notification', notification)

        // Update unread count
        const unreadCount = (await this.getUnreadNotifications(userId)).length
        user.socket.emit('unread_count', unreadCount)
      }
    })

    await Promise.all(promises)

    // Mark as delivered for connected users
    const connectedTargetUsers = notification.targetUserIds.filter(userId =>
      this.connectedUsers.has(userId),
    )

    if (connectedTargetUsers.length > 0) {
      await this.markAsDelivered(notification.notificationId)
    }
  }

  /**
   * Get notifications by type (non-expired only)
   */
  async getNotificationsByType(
    type: NotificationType,
  ): Promise<Notification[]> {
    const allItems = this.notificationQueue.getAll()
    return allItems
      .filter(item => item.data.type === type)
      .map(item => item.data)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }

  /**
   * Get queue statistics including TTL info
   */
  async getStats() {
    const expiredCount = this.notificationQueue.getExpiredCount()
    const totalCount = this.notificationQueue.totalSize()

    return {
      totalNotifications: this.notificationQueue.size(),
      expiredNotifications: expiredCount,
      totalIncludingExpired: totalCount,
      connectedUsers: this.connectedUsers.size,
      userNotificationMappings: this.userNotifications.size,
      defaultTTL: this.notificationQueue.getDefaultTTL(),
    }
  }

  /**
   * Set default TTL for new notifications
   */
  async setDefaultTTL(ttl: number): Promise<void> {
    await this.notificationQueue.setDefaultTTL(ttl)
  }

  /**
   * Remove notification by ID (regardless of expiration)
   */
  async removeNotification(notificationId: string): Promise<boolean> {
    const success = await this.notificationQueue.removeById(notificationId)

    if (success) {
      // Clean up from user mappings
      this.userNotifications.forEach((notificationIds, userId) => {
        if (notificationIds.has(notificationId)) {
          notificationIds.delete(notificationId)
          if (notificationIds.size === 0) {
            this.userNotifications.delete(userId)
          }
        }
      })
    }

    return success
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    await this.notificationQueue.destroy()
    this.connectedUsers.clear()
    this.userNotifications.clear()
  }
}

// Create singleton instance
export const notificationService = new NotificationService({
  maxQueueSize: 10,
  defaultTTL: config.ttlForNotification || 24 * 60 * 60 * 1000, // 1 day
})
