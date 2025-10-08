// types.ts
export interface QueueItem<T> {
  id: string
  data: T
  timestamp: number
  ttl?: number // TTL in milliseconds
  expiresAt: number // Calculated expiration timestamp
  metadata?: Record<string, any>
}

export interface QueueOptions {
  maxSize: number
  persistenceKey?: string
  autoSave?: boolean
  saveInterval?: number
  defaultTTL?: number // Default TTL in milliseconds
}
export interface SocketUser {
  userId: string
  socket: any // Replace with your socket type
}
