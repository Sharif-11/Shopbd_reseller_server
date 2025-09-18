"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistentBloomFilter = void 0;
const basic_ftp_1 = require("basic-ftp");
const bloom_filters_1 = require("bloom-filters");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class PersistentBloomFilter {
    constructor(config) {
        this.filter = null;
        this.isInitialized = false;
        this.ftpClient = new basic_ftp_1.Client();
        this.config = config;
        // Set default local cache path if not provided
        this.config.localCachePath =
            config.localCachePath || './bloom-filter-cache.json';
    }
    /**
     * Initialize the bloom filter from FTP server or create a new one
     */
    initialize(expectedItems, falsePositiveRate) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Try to load from FTP first
                yield this.loadFromFTP();
                this.isInitialized = true;
                console.log('Bloom filter loaded from FTP server');
            }
            catch (error) {
                console.log('Could not load from FTP, creating new filter:', error instanceof Error ? error.message : String(error));
                // Create new filter if loading fails
                if (!expectedItems || !falsePositiveRate) {
                    throw new Error('Expected items and false positive rate required for new filter creation');
                }
                this.filter = bloom_filters_1.BloomFilter.create(expectedItems, falsePositiveRate);
                yield this.saveToFTP();
                this.isInitialized = true;
                console.log('New bloom filter created and saved to FTP');
            }
        });
    }
    /**
     * Add an item to the bloom filter and persist to FTP
     */
    add(item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isInitialized || !this.filter) {
                throw new Error('Bloom filter not initialized. Call initialize() first.');
            }
            this.filter.add(item);
            yield this.saveToFTP();
        });
    }
    /**
     * Check if an item might exist in the bloom filter
     */
    has(item) {
        if (!this.isInitialized || !this.filter) {
            throw new Error('Bloom filter not initialized. Call initialize() first.');
        }
        return this.filter.has(item);
    }
    /**
     * Load bloom filter from FTP server
     */
    loadFromFTP() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Connect to FTP server
                yield this.ftpClient.access(this.config);
                // Ensure local directory exists
                const dir = path_1.default.dirname(this.config.localCachePath);
                yield promises_1.default.mkdir(dir, { recursive: true });
                // Download the file
                yield this.ftpClient.downloadTo(this.config.localCachePath, this.config.remoteFilePath);
                // Disconnect from FTP
                yield this.ftpClient.close();
                // Load and parse the filter data
                const fileData = yield promises_1.default.readFile(this.config.localCachePath, 'utf8');
                const filterData = JSON.parse(fileData);
                // Reconstruct the bloom filter
                this.filter = bloom_filters_1.BloomFilter.from(filterData, filterData.errorRate || 0.01);
            }
            catch (error) {
                this.ftpClient.close();
                throw new Error(`Failed to load from FTP: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    /**
     * Save bloom filter to FTP server
     */
    saveToFTP() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.filter) {
                throw new Error('No filter to save');
            }
            try {
                // Serialize the filter
                const filterData = this.filter.saveAsJSON();
                const serializedData = JSON.stringify(filterData);
                // Save to local cache first
                yield promises_1.default.writeFile(this.config.localCachePath, serializedData);
                // Connect to FTP server
                yield this.ftpClient.access(this.config);
                // Upload the file
                yield this.ftpClient.uploadFrom(this.config.localCachePath, this.config.remoteFilePath);
                // Disconnect from FTP
                this.ftpClient.close();
                console.log('Bloom filter saved to FTP server successfully');
            }
            catch (error) {
                this.ftpClient.close();
                throw new Error(`Failed to save to FTP: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    /**
     * Get filter statistics
     */
    getStats() {
        if (!this.filter) {
            throw new Error('Bloom filter not initialized');
        }
        return {
            size: this.filter._size,
            hashes: this.filter._nbHashes,
            length: this.filter.length,
            rate: this.filter.rate(),
        };
    }
    /**
     * Clear the local cache
     */
    clearLocalCache() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield promises_1.default.unlink(this.config.localCachePath);
                console.log('Local cache cleared');
            }
            catch (error) {
                // File might not exist, which is fine
                if (error instanceof Error &&
                    'code' in error &&
                    error.code !== 'ENOENT') {
                    throw error;
                }
            }
        });
    }
    /**
     * Close FTP connection and cleanup
     */
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.ftpClient.close();
            }
            catch (error) {
                // Ignore errors during close
            }
            this.isInitialized = false;
            this.filter = null;
        });
    }
}
exports.PersistentBloomFilter = PersistentBloomFilter;
