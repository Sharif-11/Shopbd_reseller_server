"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LRUCache = void 0;
// LRUCache.ts
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class LRUCache {
    constructor(options) {
        var _a;
        // Statistics tracking
        this.hits = 0;
        this.misses = 0;
        this.maxSize = options.maxSize;
        this.ttl = options.ttl;
        this.onEviction = options.onEviction;
        this.cache = new Map();
        this.accessOrder = [];
        // Initialize persistence
        if (options.persistence) {
            this.persistence = {
                filePath: options.persistence.filePath,
                autoSave: (_a = options.persistence.autoSave) !== null && _a !== void 0 ? _a : false,
                saveInterval: options.persistence.saveInterval,
            };
            // Load existing data if file exists
            this.loadFromFile().catch(error => {
                console.warn('Failed to load cache from file:', error.message);
            });
            // Setup auto-save if enabled
            if (this.persistence.autoSave && this.persistence.saveInterval) {
                this.autoSaveTimer = setInterval(() => {
                    this.saveToFile().catch(error => {
                        console.warn('Auto-save failed:', error.message);
                    });
                }, this.persistence.saveInterval);
            }
        }
    }
    /**
     * Set a key-value pair in the cache
     */
    set(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
            // Auto-save if enabled
            if ((_a = this.persistence) === null || _a === void 0 ? void 0 : _a.autoSave) {
                yield this.saveToFile();
            }
        });
    }
    /**
     * Get a value from the cache
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.trackAccess(false);
            return undefined;
        }
        // Check if entry has expired
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.delete(key);
            this.trackAccess(false);
            return undefined;
        }
        // Update access order
        this.updateAccessOrder(key);
        this.trackAccess(true);
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
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const entry = this.cache.get(key);
            if (entry) {
                this.cache.delete(key);
                // Remove from access order
                const index = this.accessOrder.indexOf(key);
                if (index > -1) {
                    this.accessOrder.splice(index, 1);
                }
                // Auto-save if enabled
                if ((_a = this.persistence) === null || _a === void 0 ? void 0 : _a.autoSave) {
                    yield this.saveToFile();
                }
                return true;
            }
            return false;
        });
    }
    /**
     * Clear the entire cache
     */
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.cache.clear();
            this.accessOrder = [];
            this.hits = 0;
            this.misses = 0;
            // Auto-save if enabled
            if ((_a = this.persistence) === null || _a === void 0 ? void 0 : _a.autoSave) {
                yield this.saveToFile();
            }
        });
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
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const entry = this.cache.get(key);
            if (entry) {
                entry.expiresAt = Date.now() + ttl;
                // Auto-save if enabled
                if ((_a = this.persistence) === null || _a === void 0 ? void 0 : _a.autoSave) {
                    yield this.saveToFile();
                }
                return true;
            }
            return false;
        });
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const now = Date.now();
            let cleaned = 0;
            for (const [key, entry] of this.cache.entries()) {
                if (entry.expiresAt && now > entry.expiresAt) {
                    this.delete(key);
                    cleaned++;
                }
            }
            // Auto-save if enabled
            if (((_a = this.persistence) === null || _a === void 0 ? void 0 : _a.autoSave) && cleaned > 0) {
                yield this.saveToFile();
            }
            return cleaned;
        });
    }
    /**
     * Save cache to file
     */
    saveToFile() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.persistence) {
                throw new Error('Persistence not configured');
            }
            const serialized = {
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
            };
            // Ensure directory exists
            const dir = path.dirname(this.persistence.filePath);
            yield fs.promises.mkdir(dir, { recursive: true });
            // Write to file
            yield fs.promises.writeFile(this.persistence.filePath, JSON.stringify(serialized, null, 2), 'utf-8');
        });
    }
    /**
     * Load cache from file
     */
    loadFromFile() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.persistence) {
                throw new Error('Persistence not configured');
            }
            try {
                const data = yield fs.promises.readFile(this.persistence.filePath, 'utf-8');
                const serialized = JSON.parse(data);
                // Validate and load data
                this.cache = new Map(serialized.data);
                this.accessOrder = serialized.accessOrder;
                this.hits = serialized.stats.hits;
                this.misses = serialized.stats.misses;
                // Clean up expired entries on load
                yield this.cleanup();
            }
            catch (error) {
                if (error.code === 'ENOENT') {
                    // File doesn't exist, start with empty cache
                    return;
                }
                throw error;
            }
        });
    }
    /**
     * Manually persist cache to file
     */
    persist() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveToFile();
        });
    }
    /**
     * Destroy cache and cleanup resources
     */
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.autoSaveTimer) {
                clearInterval(this.autoSaveTimer);
            }
            // Save final state
            if (this.persistence) {
                yield this.saveToFile();
            }
        });
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
    /**
     * Track hits and misses for statistics
     */
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
