// NotificationService.ts
import { v4 as uuidv4 } from 'uuid'

import { NotificationType } from '@prisma/client'
import config from '../../config'
import { Notification, NotificationData } from './NotificationTypes'
import { PersistentFIFOQueue } from './PersistentFIFOQueue'
import { SocketUser } from './types'

export class NotificationService {
  private notificationQueue: PersistentFIFOQueue<Notification>
  private connectedUsers: Map<string, SocketUser> = new Map()
  private userNotifications: Map<string, Set<string>> = new Map()

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
  addNotification(
    data: NotificationData,
    targetUserIds: string[],
    ttl?: number
  ): string {
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

    this.notificationQueue.enqueue(notificationId, notification, undefined, ttl)

    // Update user notifications mapping
    targetUserIds.forEach(userId => {
      if (!this.userNotifications.has(userId)) {
        this.userNotifications.set(userId, new Set())
      }
      this.userNotifications.get(userId)!.add(notificationId)
    })

    // Send real-time notification to connected users
    this.sendRealTimeNotification(notification)

    return notificationId
  }

  /**
   * Setup cleanup for expired notifications
   */
  private setupExpirationCleanup(): void {
    // The queue auto-cleans expired items, but we need to clean our mappings
    setInterval(() => {
      this.cleanupExpiredMappings()
    }, 60000) // Check every minute
  }

  /**
   * Clean up user notifications mapping for expired items
   */
  private cleanupExpiredMappings(): void {
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
        `Cleaned up ${expiredNotifications.size} expired notification mappings`
      )
    }
  }

  /**
   * Get all non-expired notifications for a user
   */
  getUserNotifications(userId: string): Notification[] {
    this.cleanupExpiredMappings()

    const userNotificationIds = this.userNotifications.get(userId) || new Set()
    const notifications: Notification[] = []

    userNotificationIds.forEach(notificationId => {
      const queueItem = this.notificationQueue.getById(notificationId)
      if (queueItem) {
        notifications.push(queueItem.data)
      }
    })

    // Sort by creation date, newest first
    return notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  /**
   * Get unread notifications for a user (non-expired only)
   */
  getUnreadNotifications(userId: string): Notification[] {
    return this.getUserNotifications(userId).filter(
      notification => !notification.readBy.includes(userId)
    )
  }

  /**
   * Mark notification as read by user (only if not expired)
   */
  markAsRead(notificationId: string, userId: string): boolean {
    const success = this.notificationQueue.updateById(notificationId, item => {
      const notification = { ...item.data }

      if (!notification.readBy.includes(userId)) {
        notification.readBy.push(userId)
        notification.updatedAt = new Date()
      }

      return { ...item, data: notification }
    })

    if (success) {
      // Update unread count for connected user
      const user = this.connectedUsers.get(userId)
      if (user) {
        const unreadCount = this.getUnreadNotifications(userId).length
        user.socket.emit('unread_count', unreadCount)
      }
    }

    return success
  }

  /**
   * Mark notification as delivered (only if not expired)
   */
  markAsDelivered(notificationId: string): boolean {
    return this.notificationQueue.updateById(notificationId, item => {
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
  extendNotificationTTL(
    notificationId: string,
    additionalTime: number
  ): boolean {
    return this.notificationQueue.extendTTL(notificationId, additionalTime)
  }

  /**
   * Update TTL for a notification
   */
  updateNotificationTTL(notificationId: string, newTTL: number): boolean {
    return this.notificationQueue.updateTTL(notificationId, newTTL)
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
  userConnected(userId: string, socket: any): void {
    this.connectedUsers.set(userId, { userId, socket })

    // Send all non-expired user notifications on connection
    const userNotifications = this.getUserNotifications(userId)
    socket.emit('all_notifications', userNotifications)

    // Send unread count
    const unreadCount = this.getUnreadNotifications(userId).length
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
  private sendRealTimeNotification(notification: Notification): void {
    notification.targetUserIds.forEach(userId => {
      const user = this.connectedUsers.get(userId)
      if (user) {
        user.socket.emit('new_notification', notification)

        // Update unread count
        const unreadCount = this.getUnreadNotifications(userId).length
        user.socket.emit('unread_count', unreadCount)
      }
    })

    // Mark as delivered for connected users
    const connectedTargetUsers = notification.targetUserIds.filter(userId =>
      this.connectedUsers.has(userId)
    )

    if (connectedTargetUsers.length > 0) {
      this.markAsDelivered(notification.notificationId)
    }
  }

  /**
   * Get notifications by type (non-expired only)
   */
  getNotificationsByType(type: NotificationType): Notification[] {
    const allItems = this.notificationQueue.getAll()
    return allItems
      .filter(item => item.data.type === type)
      .map(item => item.data)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }

  /**
   * Get queue statistics including TTL info
   */
  getStats() {
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
  setDefaultTTL(ttl: number): void {
    this.notificationQueue.setDefaultTTL(ttl)
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.notificationQueue.destroy()
    this.connectedUsers.clear()
    this.userNotifications.clear()
  }
}
export const notificationService = new NotificationService({
  maxQueueSize: 10,
  defaultTTL: config.ttlForNotification || 24 * 60 * 60 * 1000, // 1 day
})
