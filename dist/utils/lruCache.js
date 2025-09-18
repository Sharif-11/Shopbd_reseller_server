"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LRUCache = void 0;
class LRUCache {
    constructor(options) {
        // Statistics tracking
        this.hits = 0;
        this.misses = 0;
        this.maxSize = options.maxSize;
        this.ttl = options.ttl;
        this.onEviction = options.onEviction;
        this.cache = new Map();
        this.accessOrder = [];
    }
    /**
     * Set a key-value pair in the cache
     */
    set(key, value) {
        // Check if key already exists
        if (this.cache.has(key)) {
            this.updateAccessOrder(key);
        }
        else {
            // Add new key to access order
            this.accessOrder.unshift(key);
            // Check if we need to evict
            if (this.accessOrder.length > this.maxSize) {
                this.evict();
            }
        }
        // Create cache entry
        const entry = {
            value,
            timestamp: Date.now(),
            expiresAt: this.ttl ? Date.now() + this.ttl : undefined,
        };
        this.cache.set(key, entry);
    }
    /**
     * Get a value from the cache
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }
        // Check if entry has expired
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.delete(key);
            return undefined;
        }
        // Update access order
        this.updateAccessOrder(key);
        return entry.value;
    }
    /**
     * Check if key exists in cache
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }
        // Check expiration
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Delete a key from the cache
     */
    delete(key) {
        const entry = this.cache.get(key);
        if (entry) {
            this.cache.delete(key);
            // Remove from access order
            const index = this.accessOrder.indexOf(key);
            if (index > -1) {
                this.accessOrder.splice(index, 1);
            }
            return true;
        }
        return false;
    }
    /**
     * Clear the entire cache
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }
    /**
     * Get cache size
     */
    get size() {
        return this.cache.size;
    }
    /**
     * Get all keys in cache
     */
    keys() {
        return Array.from(this.cache.keys());
    }
    /**
     * Get all values in cache
     */
    values() {
        return Array.from(this.cache.values()).map(entry => entry.value);
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.hits + this.misses;
        return {
            size: this.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? this.hits / total : 0,
        };
    }
    /**
     * Update TTL for a specific key
     */
    updateTTL(key, ttl) {
        const entry = this.cache.get(key);
        if (entry) {
            entry.expiresAt = Date.now() + ttl;
            return true;
        }
        return false;
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt && now > entry.expiresAt) {
                this.delete(key);
                cleaned++;
            }
        }
        return cleaned;
    }
    /**
     * Private method to update access order
     */
    updateAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            // Move to front (most recently used)
            this.accessOrder.splice(index, 1);
            this.accessOrder.unshift(key);
        }
    }
    /**
     * Private method to evict least recently used item
     */
    evict() {
        const keyToEvict = this.accessOrder.pop();
        if (keyToEvict) {
            const entry = this.cache.get(keyToEvict);
            if (entry) {
                this.cache.delete(keyToEvict);
                // Call eviction callback if provided
                if (this.onEviction) {
                    this.onEviction(keyToEvict, entry.value);
                }
            }
        }
    }
    // Track hits and misses for statistics
    trackAccess(hit) {
        if (hit) {
            this.hits++;
        }
        else {
            this.misses++;
        }
    }
}
exports.LRUCache = LRUCache;
