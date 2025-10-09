import { Socket, Server as SocketIOServer } from 'socket.io'
import { NotificationService } from './NotificationService'
import { NotificationData, NotificationType } from './NotificationTypes'

export interface SocketAuthPayload {
  userId: string
}

export class NotificationSocketHandler {
  private io: SocketIOServer
  private notificationService: NotificationService

  constructor(io: SocketIOServer, notificationService: NotificationService) {
    this.io = io
    this.notificationService = notificationService
    this.setupSocketHandlers()
  }

  /**
   * Setup socket connection handlers and event listeners
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`)

      // Handle user identification when they connect
      socket.on('identify', async (authData: SocketAuthPayload) => {
        await this.handleUserIdentification(socket, authData)
      })

      // Handle marking notifications as read
      socket.on('mark_as_read', async (data: { notificationId: string }) => {
        await this.handleMarkAsRead(socket, data.notificationId)
      })

      // Handle requesting all notifications
      socket.on('get_all_notifications', async () => {
        await this.handleGetAllNotifications(socket)
      })

      // Handle requesting unread notifications
      socket.on('get_unread_notifications', async () => {
        await this.handleGetUnreadNotifications(socket)
      })

      // Handle requesting notifications by type
      socket.on('get_notifications_by_type', async (type: NotificationType) => {
        await this.handleGetNotificationsByType(socket, type)
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket)
      })

      // Handle errors
      socket.on('error', error => {
        console.error(`Socket error from ${socket.id}:`, error)
      })
    })
  }

  /**
   * Handle user identification (no authentication, just register userId)
   */
  private async handleUserIdentification(
    socket: Socket,
    authData: SocketAuthPayload
  ): Promise<void> {
    try {
      const { userId } = authData

      // Validate user ID
      if (!userId) {
        socket.emit('identification_error', { message: 'User ID is required' })
        return
      }

      // Register user with notification service
      await this.notificationService.userConnected(userId, socket)

      // Send success response
      socket.emit('identified', {
        success: true,
        userId,
      })

      console.log(`User ${userId} identified on socket ${socket.id}`)

      // Store user info in socket for later use
      socket.data.userId = userId

      // Send initial unread count
      const unreadCount = (
        await this.notificationService.getUnreadNotifications(userId)
      ).length
      socket.emit('unread_count', unreadCount)
    } catch (error) {
      console.error('User identification error:', error)
      socket.emit('identification_error', {
        message: 'Identification failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Handle marking a notification as read
   */
  private async handleMarkAsRead(
    socket: Socket,
    notificationId: string
  ): Promise<void> {
    try {
      const userId = socket.data.userId

      if (!userId) {
        socket.emit('error', { message: 'User not identified' })
        return
      }

      const success = await this.notificationService.markAsRead(
        notificationId,
        userId
      )

      if (success) {
        socket.emit('mark_as_read_success', { notificationId })

        // Send updated unread count
        const unreadCount = (
          await this.notificationService.getUnreadNotifications(userId)
        ).length
        socket.emit('unread_count', unreadCount)
      } else {
        socket.emit('mark_as_read_error', {
          notificationId,
          message: 'Notification not found or expired',
        })
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      socket.emit('error', {
        message: 'Failed to mark notification as read',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Handle request for all user notifications
   */
  private async handleGetAllNotifications(socket: Socket): Promise<void> {
    try {
      const userId = socket.data.userId

      if (!userId) {
        socket.emit('error', { message: 'User not identified' })
        return
      }

      const notifications = await this.notificationService.getUserNotifications(
        userId
      )

      socket.emit('all_notifications', notifications)
    } catch (error) {
      console.error('Error getting all notifications:', error)
      socket.emit('error', {
        message: 'Failed to retrieve notifications',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Handle request for unread notifications only
   */
  private async handleGetUnreadNotifications(socket: Socket): Promise<void> {
    try {
      const userId = socket.data.userId

      if (!userId) {
        socket.emit('error', { message: 'User not identified' })
        return
      }

      const unreadNotifications =
        await this.notificationService.getUnreadNotifications(userId)
      socket.emit('unread_notifications', unreadNotifications)
    } catch (error) {
      console.error('Error getting unread notifications:', error)
      socket.emit('error', {
        message: 'Failed to retrieve unread notifications',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Handle request for notifications by type
   */
  private async handleGetNotificationsByType(
    socket: Socket,
    type: NotificationType
  ): Promise<void> {
    try {
      const userId = socket.data.userId

      if (!userId) {
        socket.emit('error', { message: 'User not identified' })
        return
      }

      const userNotifications =
        await this.notificationService.getUserNotifications(userId)
      const filteredNotifications = userNotifications.filter(
        notification => notification.type === type
      )

      socket.emit('notifications_by_type', {
        type,
        notifications: filteredNotifications,
      })
    } catch (error) {
      console.error('Error getting notifications by type:', error)
      socket.emit('error', {
        message: 'Failed to retrieve notifications by type',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Handle user disconnect
   */
  private handleDisconnect(socket: Socket): void {
    const userId = socket.data.userId

    if (userId) {
      this.notificationService.userDisconnected(userId)
      console.log(`User ${userId} disconnected from socket ${socket.id}`)
    } else {
      console.log(`Unknown user disconnected from socket ${socket.id}`)
    }
  }

  /**
   * Broadcast notification to specific users
   */
  public async sendNotificationToUsers(
    notificationData: NotificationData,
    targetUserIds: string[],
    ttl?: number
  ): Promise<string> {
    const notificationId = await this.notificationService.addNotification(
      notificationData,
      targetUserIds,
      ttl
    )

    return notificationId
  }

  /**
   * Send notification to all connected users
   */
  public async broadcastNotification(
    notificationData: NotificationData,
    ttl?: number
  ): Promise<string> {
    // Get all connected user IDs
    const connectedUserIds = Array.from(
      this.notificationService['connectedUsers'].keys()
    )

    if (connectedUserIds.length === 0) {
      throw new Error('No connected users to broadcast to')
    }

    const notificationId = await this.notificationService.addNotification(
      notificationData,
      connectedUserIds,
      ttl
    )

    return notificationId
  }

  /**
   * Remove notification by ID
   */
  public async removeNotification(notificationId: string): Promise<boolean> {
    return await this.notificationService.removeNotification(notificationId)
  }

  /**
   * Get notification statistics
   */
  public async getStats() {
    return await this.notificationService.getStats()
  }

  /**
   * Update notification TTL
   */
  public async updateNotificationTTL(
    notificationId: string,
    newTTL: number
  ): Promise<boolean> {
    return await this.notificationService.updateNotificationTTL(
      notificationId,
      newTTL
    )
  }

  /**
   * Extend notification TTL
   */
  public async extendNotificationTTL(
    notificationId: string,
    additionalTime: number
  ): Promise<boolean> {
    return await this.notificationService.extendNotificationTTL(
      notificationId,
      additionalTime
    )
  }

  /**
   * Set default TTL for new notifications
   */
  public async setDefaultTTL(ttl: number): Promise<void> {
    await this.notificationService.setDefaultTTL(ttl)
  }

  /**
   * Cleanup resources
   */
  public async destroy(): Promise<void> {
    await this.notificationService.destroy()
  }
}
