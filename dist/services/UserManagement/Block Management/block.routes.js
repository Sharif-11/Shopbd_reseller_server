"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/block.route.ts
const express_1 = require("express");
const auth_middlewares_1 = require("../../../middlewares/auth.middlewares");
const validation_middleware_1 = __importDefault(require("../../../middlewares/validation.middleware"));
const block_controller_1 = __importDefault(require("./block.controller"));
const block_validator_1 = __importDefault(require("./block.validator"));
class BlockRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Get blocked actions for a specific user
        this.router.get('/', auth_middlewares_1.isAuthenticated, block_controller_1.default.getAllBlockActions);
        this.router.get('/:phoneNo', auth_middlewares_1.isAuthenticated, block_validator_1.default.getBlockedActions(), validation_middleware_1.default, block_controller_1.default.getBlockedActions);
        // Update block actions for a user
        this.router.put('/:phoneNo', auth_middlewares_1.isAuthenticated, block_validator_1.default.updateBlockActions(), validation_middleware_1.default, block_controller_1.default.updateBlockActions);
        // Check if user is blocked for specific action
        this.router.get('/check/:phoneNo', auth_middlewares_1.isAuthenticated, block_validator_1.default.checkBlockStatus(), validation_middleware_1.default, block_controller_1.default.checkBlockStatus);
        // Get all blocked users
        // Get block history for a user
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new BlockRouter().getRouter();
