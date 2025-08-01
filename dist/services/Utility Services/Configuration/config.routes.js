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
const client_1 = require("@prisma/client");
const express_1 = require("express");
const auth_middlewares_1 = require("../../../middlewares/auth.middlewares");
const validation_middleware_1 = __importDefault(require("../../../middlewares/validation.middleware"));
const config_controller_1 = __importDefault(require("./config.controller"));
const config_validators_1 = __importDefault(require("./config.validators"));
class ConfigRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Apply authentication middleware to all routes except feature check
        this.router.use((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // First authenticate
                yield new Promise((resolve, reject) => {
                    (0, auth_middlewares_1.isAuthenticated)(req, res, err => {
                        err ? reject(err) : resolve(true);
                    });
                });
                // Then verify permissions
                yield new Promise((resolve, reject) => {
                    (0, auth_middlewares_1.verifyPermission)(client_1.PermissionType.OTHER, client_1.ActionType.UPDATE)(req, res, err => {
                        err ? reject(err) : resolve(true);
                    });
                });
                next();
            }
            catch (error) {
                next(error);
            }
        }));
        // Config management routes
        this.router.post('/', config_validators_1.default.upsertConfig(), validation_middleware_1.default, (req, res, next) => {
            config_controller_1.default.upsertConfig(req, res, next).catch(next);
        });
        this.router.patch('/toggle/:type', (req, res, next) => {
            config_controller_1.default.toggleConfig(req, res, next).catch(next);
        });
        this.router.get('/', (req, res, next) => {
            config_controller_1.default.getAllConfigs(req, res, next).catch(next);
        });
        this.router.get('/:type', (req, res, next) => {
            config_controller_1.default.getConfig(req, res, next).catch(next);
        });
        // Public feature check route
        this.router.get('/feature/:type/:feature', config_validators_1.default.featureCheck(), validation_middleware_1.default, (req, res, next) => {
            config_controller_1.default.checkFeature(req, res, next).catch(next);
        });
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new ConfigRouter().getRouter();
