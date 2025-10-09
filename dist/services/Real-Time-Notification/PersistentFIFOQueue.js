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
exports.PersistentFIFOQueue = void 0;
// PersistentFIFOQueue.ts
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class PersistentFIFOQueue {
    constructor(options) {
        var _a, _b, _c;
        this.items = [];
        this.maxSize = options.maxSize;
        this.storagePath = options.persistenceKey
            ? this.getStoragePath(options.persistenceKey)
            : undefined;
        this.autoSave = (_a = options.autoSave) !== null && _a !== void 0 ? _a : true;
        this.saveInterval = (_b = options.saveInterval) !== null && _b !== void 0 ? _b : 5000;
        this.defaultTTL = (_c = options.defaultTTL) !== null && _c !== void 0 ? _c : 24 * 60 * 60 * 1000; // Default: 1 day
        this.loadFromStorage();
        this.startAutoCleanup();
        if (this.autoSave && this.storagePath) {
            this.startAutoSave();
        }
    }
    /**
     * Get storage file path
     */
    getStoragePath(persistenceKey) {
        // Store in a 'queue-data' directory in the current working directory
        const dataDir = path.join(process.cwd(), 'queue-data');
        return path.join(dataDir, `${persistenceKey}.json`);
    }
    /**
     * Ensure storage directory exists
     */
    ensureStorageDir() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storagePath)
                return;
            const dataDir = path.dirname(this.storagePath);
            try {
                yield fs.access(dataDir);
            }
            catch (_a) {
                yield fs.mkdir(dataDir, { recursive: true });
            }
        });
    }
    /**
     * Add item to queue with TTL
     */
    enqueue(id, data, metadata, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            const itemTTL = ttl !== null && ttl !== void 0 ? ttl : this.defaultTTL;
            const item = {
                id,
                data,
                timestamp: now,
                ttl: itemTTL,
                expiresAt: now + itemTTL,
                metadata,
            };
            // Remove expired items before adding new one
            this.removeExpiredItems();
            // Evict oldest if capacity exceeded
            if (this.items.length >= this.maxSize) {
                this.items.shift(); // Remove oldest
            }
            this.items.push(item);
            if (this.autoSave) {
                yield this.saveToStorage();
            }
        });
    }
    /**
     * Remove and return the oldest non-expired item
     */
    dequeue() {
        return __awaiter(this, void 0, void 0, function* () {
            this.removeExpiredItems();
            const item = this.items.shift();
            if (item && this.autoSave) {
                yield this.saveToStorage();
            }
            return item || null;
        });
    }
    /**
     * Get all non-expired items
     */
    getAll() {
        this.removeExpiredItems();
        return [...this.items];
    }
    /**
     * Get non-expired items by filter function
     */
    getByFilter(filterFn) {
        this.removeExpiredItems();
        return this.items.filter(filterFn);
    }
    /**
     * Get non-expired item by ID
     */
    getById(id) {
        this.removeExpiredItems();
        return this.items.find(item => item.id === id) || null;
    }
    /**
     * Remove item by ID (regardless of expiration)
     */
    removeById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const initialLength = this.items.length;
            this.items = this.items.filter(item => item.id !== id);
            if (this.items.length !== initialLength && this.autoSave) {
                yield this.saveToStorage();
                return true;
            }
            return false;
        });
    }
    /**
     * Update item by ID (only if not expired)
     */
    updateById(id, updateFn) {
        return __awaiter(this, void 0, void 0, function* () {
            this.removeExpiredItems();
            const index = this.items.findIndex(item => item.id === id);
            if (index !== -1) {
                this.items[index] = updateFn(this.items[index]);
                if (this.autoSave) {
                    yield this.saveToStorage();
                }
                return true;
            }
            return false;
        });
    }
    /**
     * Update TTL for an item
     */
    updateTTL(id, newTTL) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updateById(id, item => {
                const now = Date.now();
                return Object.assign(Object.assign({}, item), { ttl: newTTL, expiresAt: now + newTTL });
            });
        });
    }
    /**
     * Extend TTL for an item by adding time
     */
    extendTTL(id, additionalTime) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updateById(id, item => {
                return Object.assign(Object.assign({}, item), { ttl: (item.ttl || this.defaultTTL) + additionalTime, expiresAt: item.expiresAt + additionalTime });
            });
        });
    }
    /**
     * Remove expired items from the queue
     */
    removeExpiredItems() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            const initialLength = this.items.length;
            this.items = this.items.filter(item => item.expiresAt > now);
            const removedCount = initialLength - this.items.length;
            if (removedCount > 0 && this.autoSave) {
                yield this.saveToStorage();
            }
            return removedCount;
        });
    }
    /**
     * Get items that will expire within a time range
     */
    getExpiringItems(withinMs = 0) {
        const now = Date.now();
        return this.items.filter(item => {
            const timeUntilExpiry = item.expiresAt - now;
            return timeUntilExpiry > 0 && timeUntilExpiry <= withinMs;
        });
    }
    /**
     * Get expiration time for an item
     */
    getTimeUntilExpiry(id) {
        const item = this.getById(id);
        if (!item)
            return null;
        const now = Date.now();
        return Math.max(0, item.expiresAt - now);
    }
    /**
     * Check if item is expired
     */
    isExpired(id) {
        const item = this.items.find(item => item.id === id);
        if (!item)
            return true;
        return Date.now() > item.expiresAt;
    }
    /**
     * Get queue size (non-expired only)
     */
    size() {
        this.removeExpiredItems();
        return this.items.length;
    }
    /**
     * Get total size including expired items
     */
    totalSize() {
        return this.items.length;
    }
    /**
     * Get expired count
     */
    getExpiredCount() {
        const now = Date.now();
        return this.items.filter(item => item.expiresAt <= now).length;
    }
    /**
     * Check if queue is empty (non-expired only)
     */
    isEmpty() {
        this.removeExpiredItems();
        return this.items.length === 0;
    }
    /**
     * Clear all items
     */
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            this.items = [];
            if (this.autoSave) {
                yield this.saveToStorage();
            }
        });
    }
    /**
     * Start automatic cleanup of expired items
     */
    startAutoCleanup(intervalMs = 60000) {
        // Default: 1 minute
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.cleanupTimer = setInterval(() => {
            this.removeExpiredItems().then(removed => {
                if (removed > 0) {
                    console.log(`Auto-cleanup removed ${removed} expired items`);
                }
            });
        }, intervalMs);
    }
    /**
     * Save to persistent storage
     */
    saveToStorage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storagePath)
                return;
            try {
                yield this.ensureStorageDir();
                const data = {
                    items: this.items,
                    savedAt: Date.now(),
                    defaultTTL: this.defaultTTL,
                    maxSize: this.maxSize,
                };
                yield fs.writeFile(this.storagePath, JSON.stringify(data, null, 2), 'utf-8');
            }
            catch (error) {
                console.warn('Failed to save queue to storage:', error);
            }
        });
    }
    /**
     * Load from persistent storage
     */
    loadFromStorage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storagePath)
                return;
            try {
                yield fs.access(this.storagePath);
                const fileContent = yield fs.readFile(this.storagePath, 'utf-8');
                if (fileContent) {
                    const parsed = JSON.parse(fileContent);
                    this.items = parsed.items || [];
                    this.defaultTTL = parsed.defaultTTL || this.defaultTTL;
                    // Ensure we don't exceed maxSize after loading
                    if (this.items.length > this.maxSize) {
                        this.items = this.items.slice(-this.maxSize);
                    }
                    // Remove any expired items on load
                    yield this.removeExpiredItems();
                }
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    // Only warn if it's not a "file not found" error
                    console.warn('Failed to load queue from storage:', error);
                }
            }
        });
    }
    /**
     * Start auto-save timer
     */
    startAutoSave() {
        if (this.saveTimer) {
            clearInterval(this.saveTimer);
        }
        this.saveTimer = setInterval(() => {
            this.saveToStorage().catch(error => {
                console.warn('Auto-save failed:', error);
            });
        }, this.saveInterval);
    }
    /**
     * Set new default TTL
     */
    setDefaultTTL(ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            this.defaultTTL = ttl;
            if (this.autoSave) {
                yield this.saveToStorage();
            }
        });
    }
    /**
     * Get current default TTL
     */
    getDefaultTTL() {
        return this.defaultTTL;
    }
    /**
     * Get current storage path (for debugging/inspection)
     */
    getCurrentStoragePath() {
        return this.storagePath;
    }
    /**
     * Cleanup resources
     */
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.saveTimer) {
                clearInterval(this.saveTimer);
            }
            if (this.cleanupTimer) {
                clearInterval(this.cleanupTimer);
            }
            yield this.saveToStorage();
        });
    }
}
exports.PersistentFIFOQueue = PersistentFIFOQueue;
