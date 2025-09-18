// LRUCache.ts
// types.ts
export interface LRUCacheOptions<K, V> {
  maxSize: number
  ttl?: number // Time to live in milliseconds
  onEviction?: (key: K, value: V) => void
}

export interface CacheEntry<V> {
  value: V
  timestamp: number
  expiresAt?: number
}

export class LRUCache<K, V> {
  private maxSize: number
  private ttl?: number
  private onEviction?: (key: K, value: V) => void

  private cache: Map<K, CacheEntry<V>>
  private accessOrder: K[]

  constructor(options: LRUCacheOptions<K, V>) {
    this.maxSize = options.maxSize
    this.ttl = options.ttl
    this.onEviction = options.onEviction

    this.cache = new Map()
    this.accessOrder = []
  }

  /**
   * Set a key-value pair in the cache
   */
  set(key: K, value: V): void {
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
  }

  /**
   * Get a value from the cache
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      return undefined
    }

    // Check if entry has expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key)
      return undefined
    }

    // Update access order
    this.updateAccessOrder(key)

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
  delete(key: K): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      this.cache.delete(key)

      // Remove from access order
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }

      return true
    }
    return false
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
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
  updateTTL(key: K, ttl: number): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      entry.expiresAt = Date.now() + ttl
      return true
    }
    return false
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.delete(key)
        cleaned++
      }
    }

    return cleaned
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

  // Statistics tracking
  private hits: number = 0
  private misses: number = 0

  // Track hits and misses for statistics
  private trackAccess(hit: boolean): void {
    if (hit) {
      this.hits++
    } else {
      this.misses++
    }
  }
}
