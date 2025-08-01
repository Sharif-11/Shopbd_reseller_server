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
const prisma_1 = __importDefault(require("../../../utils/prisma"));
class ConfigServices {
    /**
     * Create or update a config type
     */
    upsertConfig(type, content) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!type || !content) {
                throw new Error('Type and content are required');
            }
            const existingConfig = yield prisma_1.default.config.findUnique({ where: { type } });
            if (existingConfig) {
                // Update existing config
                return yield prisma_1.default.config.update({
                    where: { type },
                    data: {
                        content,
                        version: existingConfig.version + 1,
                        updatedAt: new Date(),
                    },
                });
            }
            else {
                // Create new config
                return yield prisma_1.default.config.create({
                    data: {
                        type,
                        content,
                        isActive: true,
                        version: 1,
                    },
                });
            }
        });
    }
    /**
     * Toggle active status of a config
     */
    toggleConfig(type) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield prisma_1.default.config.findUnique({ where: { type } });
            if (!config) {
                throw new Error('Config not found');
            }
            return yield prisma_1.default.config.update({
                where: { type },
                data: {
                    isActive: !config.isActive,
                    updatedAt: new Date(),
                },
            });
        });
    }
    /**
     * Check if a specific feature is enabled
     */
    checkFeature(type, feature) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield prisma_1.default.config.findUnique({ where: { type } });
            if (!config) {
                throw new Error('Config not found');
            }
            if (!config.isActive) {
                return { enabled: false };
            }
            const content = config.content;
            const isEnabled = content[feature] !== false; // Default to true if not specified
            return { enabled: isEnabled };
        });
    }
    /**
     * Get all configs (for admin panel)
     */
    getAllConfigs() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.config.findMany({
                orderBy: { createdAt: 'desc' },
            });
        });
    }
    /**
     * Get single config by type
     */
    getConfig(type) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield prisma_1.default.config.findUnique({ where: { type } });
            if (!config) {
                throw new Error('Config not found');
            }
            return config;
        });
    }
}
exports.default = new ConfigServices();
