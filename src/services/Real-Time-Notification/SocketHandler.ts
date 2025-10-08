import { createServer } from 'http'
import jwt from 'jsonwebtoken'
import { Socket, Server as SocketIOServer } from 'socket.io'
import app from '../../app'
import config from '../../config'
import prisma from '../../utils/prisma'
import { notificationService, NotificationService } from './NotificationService'
import { NotificationType } from './NotificationTypes'

export interface SocketAuthPayload {
  userId: string
  userType: 'admin' | 'user' // or whatever user types you have
  token?: string
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

      // Handle user authentication when they connect
      socket.on('authenticate', (authData: SocketAuthPayload) => {
        this.handleAuthentication(socket, authData)
      })

      // Handle marking notifications as read
      socket.on('mark_as_read', (data: { notificationId: string }) => {
        this.handleMarkAsRead(socket, data.notificationId)
      })

      // Handle requesting all notifications
      socket.on('get_all_notifications', () => {
        this.handleGetAllNotifications(socket)
      })

      // Handle requesting unread notifications
      socket.on('get_unread_notifications', () => {
        this.handleGetUnreadNotifications(socket)
      })

      // Handle requesting notifications by type
      socket.on('get_notifications_by_type', (type: NotificationType) => {
        this.handleGetNotificationsByType(socket, type)
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
   * Handle user authentication and send initial notifications
   */
  private async handleAuthentication(
    socket: Socket,
    authData: SocketAuthPayload
  ): Promise<void> {
    try {
      const { userId, userType, token } = authData

      // Validate authentication data
      if (!userId) {
        socket.emit('authentication_error', { message: 'User ID is required' })
        return
      }

      // Verify token if needed (implement your token verification logic)
      if (!token || !(await this.verifyToken(token))) {
        socket.emit('authentication_error', { message: 'Invalid token' })
        return
      }

      // Register user with notification service
      this.notificationService.userConnected(userId, socket)

      // Send success response
      socket.emit('authenticated', {
        success: true,
        userId,
        userType,
      })

      console.log(
        `User ${userId} (${userType}) authenticated on socket ${socket.id}`
      )

      // Store user info in socket for later use
      socket.data.userId = userId
      socket.data.userType = userType
    } catch (error) {
      console.error('Authentication error:', error)
      socket.emit('authentication_error', {
        message: 'Authentication failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Handle marking a notification as read
   */
  private handleMarkAsRead(socket: Socket, notificationId: string): void {
    try {
      const userId = socket.data.userId

      if (!userId) {
        socket.emit('error', { message: 'User not authenticated' })
        return
      }

      const success = this.notificationService.markAsRead(
        notificationId,
        userId
      )

      if (success) {
        socket.emit('mark_as_read_success', { notificationId })

        // Send updated unread count
        const unreadCount =
          this.notificationService.getUnreadNotifications(userId).length
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
  private handleGetAllNotifications(socket: Socket): void {
    try {
      const userId = socket.data.userId

      if (!userId) {
        socket.emit('error', { message: 'User not authenticated' })
        return
      }

      const notifications =
        this.notificationService.getUserNotifications(userId)
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
  private handleGetUnreadNotifications(socket: Socket): void {
    try {
      const userId = socket.data.userId

      if (!userId) {
        socket.emit('error', { message: 'User not authenticated' })
        return
      }

      const unreadNotifications =
        this.notificationService.getUnreadNotifications(userId)
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
  private handleGetNotificationsByType(
    socket: Socket,
    type: NotificationType
  ): void {
    try {
      const userId = socket.data.userId

      if (!userId) {
        socket.emit('error', { message: 'User not authenticated' })
        return
      }

      const userNotifications =
        this.notificationService.getUserNotifications(userId)
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
   * Token verification method (implement according to your auth system)
   */
  private async verifyToken(token: string): Promise<boolean> {
    // Implement your token verification logic here
    // This could be JWT verification, session validation, etc.
    // For now, returning true for demonstration
    // In production, you should properly verify the token
    const payload = jwt.verify(token, config.jwtSecret as string)
    // check if user with userId exists
    const { userId } = payload as any
    const user = await prisma.user.findUnique({
      where: { userId },
    })

    if (!user) {
      throw new Error('User not found')
    }
    return true
  }

  /**
   * Broadcast notification to specific users (useful for server-side triggers)
   */
  public sendNotificationToUsers(
    notificationData: any,
    targetUserIds: string[],
    ttl?: number
  ): string {
    const notificationId = this.notificationService.addNotification(
      notificationData,
      targetUserIds,
      ttl
    )

    return notificationId
  }

  /**
   * Get notification statistics
   */
  public getStats() {
    return this.notificationService.getStats()
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.notificationService.destroy()
  }
}

const server = createServer(app)

const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Accept all origins
    methods: ['GET', 'POST'],
  },
})

// Initialize socket handler
const notificationSocketHandler = new NotificationSocketHandler(
  io,
  notificationService
)
export { io, notificationSocketHandler, server }
