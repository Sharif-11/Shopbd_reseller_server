// NotificationTypes.ts
export type NotificationType =
  | 'NEW_ORDER'
  | 'PAYMENT_REQUEST'
  | 'WITHDRAW_REQUEST'
  | 'TICKET_MESSAGE'
  | 'SYSTEM_ALERT'

export interface NotificationData {
  type: NotificationType
  title: string
  message: string
  data?: any // Flexible data storage for additional context
  orderId?: number
  paymentId?: string
  withdrawId?: string
  ticketId?: string
}

export interface Notification extends NotificationData {
  notificationId: string
  targetUserIds: string[]
  readBy: string[]
  isDelivered: boolean
  deliveredAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface SocketUser {
  userId: string
  socket: any // Replace with your socket type
}
