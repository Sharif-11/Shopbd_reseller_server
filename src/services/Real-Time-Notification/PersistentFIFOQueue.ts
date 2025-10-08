// PersistentFIFOQueue.ts
import { QueueItem, QueueOptions } from './types'

export class PersistentFIFOQueue<T> {
  private items: QueueItem<T>[] = []
  private maxSize: number
  private persistenceKey?: string
  private autoSave: boolean
  private saveInterval: number
  private defaultTTL: number
  private saveTimer?: NodeJS.Timeout
  private cleanupTimer?: NodeJS.Timeout

  constructor(options: QueueOptions) {
    this.maxSize = options.maxSize
    this.persistenceKey = options.persistenceKey
    this.autoSave = options.autoSave ?? true
    this.saveInterval = options.saveInterval ?? 5000
    this.defaultTTL = options.defaultTTL ?? 24 * 60 * 60 * 1000 // Default: 1 day

    this.loadFromStorage()
    this.startAutoCleanup()

    if (this.autoSave && this.persistenceKey) {
      this.startAutoSave()
    }
  }

  /**
   * Add item to queue with TTL
   */
  enqueue(
    id: string,
    data: T,
    metadata?: Record<string, any>,
    ttl?: number
  ): void {
    const now = Date.now()
    const itemTTL = ttl ?? this.defaultTTL

    const item: QueueItem<T> = {
      id,
      data,
      timestamp: now,
      ttl: itemTTL,
      expiresAt: now + itemTTL,
      metadata,
    }

    // Remove expired items before adding new one
    this.removeExpiredItems()

    // Evict oldest if capacity exceeded
    if (this.items.length >= this.maxSize) {
      this.items.shift() // Remove oldest
    }

    this.items.push(item)
    this.autoSave && this.saveToStorage()
  }

  /**
   * Remove and return the oldest non-expired item
   */
  dequeue(): QueueItem<T> | null {
    this.removeExpiredItems()

    const item = this.items.shift()
    if (item && this.autoSave) {
      this.saveToStorage()
    }
    return item || null
  }

  /**
   * Get all non-expired items
   */
  getAll(): QueueItem<T>[] {
    this.removeExpiredItems()
    return [...this.items]
  }

  /**
   * Get non-expired items by filter function
   */
  getByFilter(filterFn: (item: QueueItem<T>) => boolean): QueueItem<T>[] {
    this.removeExpiredItems()
    return this.items.filter(filterFn)
  }

  /**
   * Get non-expired item by ID
   */
  getById(id: string): QueueItem<T> | null {
    this.removeExpiredItems()
    return this.items.find(item => item.id === id) || null
  }

  /**
   * Remove item by ID (regardless of expiration)
   */
  removeById(id: string): boolean {
    const initialLength = this.items.length
    this.items = this.items.filter(item => item.id !== id)

    if (this.items.length !== initialLength && this.autoSave) {
      this.saveToStorage()
      return true
    }
    return false
  }

  /**
   * Update item by ID (only if not expired)
   */
  updateById(
    id: string,
    updateFn: (item: QueueItem<T>) => QueueItem<T>
  ): boolean {
    this.removeExpiredItems()

    const index = this.items.findIndex(item => item.id === id)
    if (index !== -1) {
      this.items[index] = updateFn(this.items[index])
      this.autoSave && this.saveToStorage()
      return true
    }
    return false
  }

  /**
   * Update TTL for an item
   */
  updateTTL(id: string, newTTL: number): boolean {
    return this.updateById(id, item => {
      const now = Date.now()
      return {
        ...item,
        ttl: newTTL,
        expiresAt: now + newTTL,
      }
    })
  }

  /**
   * Extend TTL for an item by adding time
   */
  extendTTL(id: string, additionalTime: number): boolean {
    return this.updateById(id, item => {
      return {
        ...item,
        ttl: (item.ttl || this.defaultTTL) + additionalTime,
        expiresAt: item.expiresAt + additionalTime,
      }
    })
  }

  /**
   * Remove expired items from the queue
   */
  removeExpiredItems(): number {
    const now = Date.now()
    const initialLength = this.items.length

    this.items = this.items.filter(item => item.expiresAt > now)

    const removedCount = initialLength - this.items.length
    if (removedCount > 0 && this.autoSave) {
      this.saveToStorage()
    }

    return removedCount
  }

  /**
   * Get items that will expire within a time range
   */
  getExpiringItems(withinMs: number = 0): QueueItem<T>[] {
    const now = Date.now()
    return this.items.filter(item => {
      const timeUntilExpiry = item.expiresAt - now
      return timeUntilExpiry > 0 && timeUntilExpiry <= withinMs
    })
  }

  /**
   * Get expiration time for an item
   */
  getTimeUntilExpiry(id: string): number | null {
    const item = this.getById(id)
    if (!item) return null

    const now = Date.now()
    return Math.max(0, item.expiresAt - now)
  }

  /**
   * Check if item is expired
   */
  isExpired(id: string): boolean {
    const item = this.items.find(item => item.id === id)
    if (!item) return true

    return Date.now() > item.expiresAt
  }

  /**
   * Get queue size (non-expired only)
   */
  size(): number {
    this.removeExpiredItems()
    return this.items.length
  }

  /**
   * Get total size including expired items
   */
  totalSize(): number {
    return this.items.length
  }

  /**
   * Get expired count
   */
  getExpiredCount(): number {
    const now = Date.now()
    return this.items.filter(item => item.expiresAt <= now).length
  }

  /**
   * Check if queue is empty (non-expired only)
   */
  isEmpty(): boolean {
    this.removeExpiredItems()
    return this.items.length === 0
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.items = []
    this.autoSave && this.saveToStorage()
  }

  /**
   * Start automatic cleanup of expired items
   */
  private startAutoCleanup(intervalMs: number = 60000): void {
    // Default: 1 minute
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      const removed = this.removeExpiredItems()
      if (removed > 0) {
        console.log(`Auto-cleanup removed ${removed} expired items`)
      }
    }, intervalMs)
  }

  /**
   * Save to persistent storage
   */
  saveToStorage(): void {
    if (!this.persistenceKey) return

    try {
      localStorage.setItem(
        this.persistenceKey,
        JSON.stringify({
          items: this.items,
          savedAt: Date.now(),
          defaultTTL: this.defaultTTL,
        })
      )
    } catch (error) {
      console.warn('Failed to save queue to storage:', error)
    }
  }

  /**
   * Load from persistent storage
   */
  private loadFromStorage(): void {
    if (!this.persistenceKey) return

    try {
      const stored = localStorage.getItem(this.persistenceKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.items = parsed.items || []
        this.defaultTTL = parsed.defaultTTL || this.defaultTTL

        // Ensure we don't exceed maxSize after loading
        if (this.items.length > this.maxSize) {
          this.items = this.items.slice(-this.maxSize)
        }

        // Remove any expired items on load
        this.removeExpiredItems()
      }
    } catch (error) {
      console.warn('Failed to load queue from storage:', error)
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
    }

    this.saveTimer = setInterval(() => {
      this.saveToStorage()
    }, this.saveInterval)
  }

  /**
   * Set new default TTL
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl
    this.autoSave && this.saveToStorage()
  }

  /**
   * Get current default TTL
   */
  getDefaultTTL(): number {
    return this.defaultTTL
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.saveToStorage()
  }
}
