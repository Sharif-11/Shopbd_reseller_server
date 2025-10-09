// LRUCache.ts
import * as fs from 'fs'
import * as path from 'path'

// types.ts
export interface LRUCacheOptions<K, V> {
  maxSize: number
  ttl?: number // Time to live in milliseconds
  onEviction?: (key: K, value: V) => void
  persistence?: {
    filePath: string
    autoSave?: boolean
    saveInterval?: number // Auto-save interval in milliseconds
  }
}

export interface CacheEntry<V> {
  value: V
  timestamp: number
  expiresAt?: number
}

export interface SerializedCache<K, V> {
  data: Array<[K, CacheEntry<V>]>
  accessOrder: K[]
  stats: {
    hits: number
    misses: number
  }
  metadata: {
    version: string
    savedAt: string
    maxSize: number
    ttl?: number
  }
}

export class LRUCache<K, V> {
  private maxSize: number
  private ttl?: number
  private onEviction?: (key: K, value: V) => void
  private persistence?: {
    filePath: string
    autoSave: boolean
    saveInterval?: number
  }

  private cache: Map<K, CacheEntry<V>>
  private accessOrder: K[]
  private autoSaveTimer?: NodeJS.Timeout

  // Statistics tracking
  private hits: number = 0
  private misses: number = 0

  constructor(options: LRUCacheOptions<K, V>) {
    this.maxSize = options.maxSize
    this.ttl = options.ttl
    this.onEviction = options.onEviction

    this.cache = new Map()
    this.accessOrder = []

    // Initialize persistence
    if (options.persistence) {
      this.persistence = {
        filePath: options.persistence.filePath,
        autoSave: options.persistence.autoSave ?? false,
        saveInterval: options.persistence.saveInterval,
      }

      // Load existing data if file exists
      this.loadFromFile().catch(error => {
        console.warn('Failed to load cache from file:', error.message)
      })

      // Setup auto-save if enabled
      if (this.persistence.autoSave && this.persistence.saveInterval) {
        this.autoSaveTimer = setInterval(() => {
          this.saveToFile().catch(error => {
            console.warn('Auto-save failed:', error.message)
          })
        }, this.persistence.saveInterval)
      }
    }
  }

  /**
   * Set a key-value pair in the cache
   */
  async set(key: K, value: V): Promise<void> {
    // Check if key already exists
    if (this.cache.has(key)) {
      this.updateAccessOrder(key)
    } else {
      // Add new key to access order
      this.accessOrder.unshift(key)

      // Check if we need to evict
      if (this.accessOrder.length > this.maxSize) {
        this.evict()
      }
    }

    // Create cache entry
    const entry: CacheEntry<V> = {
      value,
      timestamp: Date.now(),
      expiresAt: this.ttl ? Date.now() + this.ttl : undefined,
    }

    this.cache.set(key, entry)

    // Auto-save if enabled
    if (this.persistence?.autoSave) {
      await this.saveToFile()
    }
  }

  /**
   * Get a value from the cache
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      this.trackAccess(false)
      return undefined
    }

    // Check if entry has expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key)
      this.trackAccess(false)
      return undefined
    }

    // Update access order
    this.updateAccessOrder(key)
    this.trackAccess(true)

    return entry.value
  }

  /**
   * Check if key exists in cache
   */
  has(key: K): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete a key from the cache
   */
  async delete(key: K): Promise<boolean> {
    const entry = this.cache.get(key)
    if (entry) {
      this.cache.delete(key)

      // Remove from access order
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }

      // Auto-save if enabled
      if (this.persistence?.autoSave) {
        await this.saveToFile()
      }

      return true
    }
    return false
  }

  /**
   * Clear the entire cache
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.accessOrder = []
    this.hits = 0
    this.misses = 0

    // Auto-save if enabled
    if (this.persistence?.autoSave) {
      await this.saveToFile()
    }
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * Get all keys in cache
   */
  keys(): K[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get all values in cache
   */
  values(): V[] {
    return Array.from(this.cache.values()).map(entry => entry.value)
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses
    return {
      size: this.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    }
  }

  /**
   * Update TTL for a specific key
   */
  async updateTTL(key: K, ttl: number): Promise<boolean> {
    const entry = this.cache.get(key)
    if (entry) {
      entry.expiresAt = Date.now() + ttl

      // Auto-save if enabled
      if (this.persistence?.autoSave) {
        await this.saveToFile()
      }
      return true
    }
    return false
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.delete(key)
        cleaned++
      }
    }

    // Auto-save if enabled
    if (this.persistence?.autoSave && cleaned > 0) {
      await this.saveToFile()
    }

    return cleaned
  }

  /**
   * Save cache to file
   */
  async saveToFile(): Promise<void> {
    if (!this.persistence) {
      throw new Error('Persistence not configured')
    }

    const serialized: SerializedCache<K, V> = {
      data: Array.from(this.cache.entries()),
      accessOrder: this.accessOrder,
      stats: {
        hits: this.hits,
        misses: this.misses,
      },
      metadata: {
        version: '1.0.0',
        savedAt: new Date().toISOString(),
        maxSize: this.maxSize,
        ttl: this.ttl,
      },
    }

    // Ensure directory exists
    const dir = path.dirname(this.persistence.filePath)
    await fs.promises.mkdir(dir, { recursive: true })

    // Write to file
    await fs.promises.writeFile(
      this.persistence.filePath,
      JSON.stringify(serialized, null, 2),
      'utf-8',
    )
  }

  /**
   * Load cache from file
   */
  async loadFromFile(): Promise<void> {
    if (!this.persistence) {
      throw new Error('Persistence not configured')
    }

    try {
      const data = await fs.promises.readFile(
        this.persistence.filePath,
        'utf-8',
      )
      const serialized: SerializedCache<K, V> = JSON.parse(data)

      // Validate and load data
      this.cache = new Map(serialized.data)
      this.accessOrder = serialized.accessOrder
      this.hits = serialized.stats.hits
      this.misses = serialized.stats.misses

      // Clean up expired entries on load
      await this.cleanup()
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, start with empty cache
        return
      }
      throw error
    }
  }

  /**
   * Manually persist cache to file
   */
  async persist(): Promise<void> {
    await this.saveToFile()
  }

  /**
   * Destroy cache and cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }

    // Save final state
    if (this.persistence) {
      await this.saveToFile()
    }
  }

  /**
   * Private method to update access order
   */
  private updateAccessOrder(key: K): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      // Move to front (most recently used)
      this.accessOrder.splice(index, 1)
      this.accessOrder.unshift(key)
    }
  }

  /**
   * Private method to evict least recently used item
   */
  private evict(): void {
    const keyToEvict = this.accessOrder.pop()
    if (keyToEvict) {
      const entry = this.cache.get(keyToEvict)
      if (entry) {
        this.cache.delete(keyToEvict)

        // Call eviction callback if provided
        if (this.onEviction) {
          this.onEviction(keyToEvict, entry.value)
        }
      }
    }
  }

  /**
   * Track hits and misses for statistics
   */
  private trackAccess(hit: boolean): void {
    if (hit) {
      this.hits++
    } else {
      this.misses++
    }
  }
}

// Usage example:
/*
const cache = new LRUCache<string, any>({
  maxSize: 100,
  ttl: 60 * 60 * 1000, // 1 hour
  persistence: {
    filePath: './cache/data.json',
    autoSave: true,
    saveInterval: 30 * 1000, // Save every 30 seconds
  },
});

// Use cache as normal
await cache.set('user:123', { name: 'John', age: 30 });
const user = cache.get('user:123');

// Manually persist if needed
await cache.persist();

// Cleanup when done
await cache.destroy();
*/
