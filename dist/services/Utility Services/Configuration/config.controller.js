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
const config_services_1 = __importDefault(require("./config.services"));
class ConfigController {
    /**
     * Create or update a config type
     */
    upsertConfig(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { type, content } = req.body;
                const config = yield config_services_1.default.upsertConfig(type, content);
                return res.status(config.version === 1 ? 201 : 200).json({
                    statusCode: config.version === 1 ? 201 : 200,
                    message: `Config ${config.version === 1 ? 'created' : 'updated'} successfully`,
                    success: true,
                    data: config,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Toggle active status of a config
     */
    toggleConfig(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { type } = req.params;
                const config = yield config_services_1.default.toggleConfig(type);
                return res.status(200).json({
                    statusCode: 200,
                    message: 'Config status toggled successfully',
                    success: true,
                    data: config,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Check if a specific feature is enabled
     */
    checkFeature(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { type, feature } = req.params;
                const { enabled } = yield config_services_1.default.checkFeature(type, feature);
                return res.status(200).json({
                    statusCode: 200,
                    message: 'Feature status checked',
                    success: true,
                    data: { enabled },
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get all configs (for admin panel)
     */
    getAllConfigs(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const configs = yield config_services_1.default.getAllConfigs();
                return res.status(200).json({
                    statusCode: 200,
                    message: 'Configs fetched successfully',
                    success: true,
                    data: configs,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get single config by type
     */
    getConfig(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { type } = req.params;
                const config = yield config_services_1.default.getConfig(type);
                return res.status(200).json({
                    statusCode: 200,
                    message: 'Config fetched successfully',
                    success: true,
                    data: config,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new ConfigController();
