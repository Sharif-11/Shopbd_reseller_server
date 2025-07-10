"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = require("../../middlewares/auth.middlewares");
const validation_middleware_1 = __importDefault(require("../../middlewares/validation.middleware"));
const supportTicket_controllers_1 = __importDefault(require("./supportTicket.controllers"));
const supportTicket_validator_1 = __importDefault(require("./supportTicket.validator"));
class SupportTicketRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Seller routes
        this.router.post('/', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.verifyAccess)('SUPPORT_TICKET'), supportTicket_validator_1.default.createTicket(), validation_middleware_1.default, supportTicket_controllers_1.default.createTicket);
        this.router.post('/reply', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.verifyAccess)('SUPPORT_TICKET'), supportTicket_validator_1.default.replyToTicket(), validation_middleware_1.default, supportTicket_controllers_1.default.replyToTicket);
        this.router.get('/user', auth_middlewares_1.isAuthenticated, supportTicket_validator_1.default.getUserTickets(), validation_middleware_1.default, supportTicket_controllers_1.default.getUserTickets);
        this.router.get('/:ticketId', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.verifyAccess)('SUPPORT_TICKET'), supportTicket_validator_1.default.getTicketDetails(), validation_middleware_1.default, supportTicket_controllers_1.default.getTicketDetails);
        // Admin routes
        this.router.post('/admin/reply', auth_middlewares_1.isAuthenticated, supportTicket_validator_1.default.replyToTicket(), validation_middleware_1.default, supportTicket_controllers_1.default.replyToTicket);
        this.router.post('/admin/close/:ticketId', auth_middlewares_1.isAuthenticated, supportTicket_validator_1.default.closeTicket(), validation_middleware_1.default, supportTicket_controllers_1.default.closeTicket);
        this.router.get('/admin/all', auth_middlewares_1.isAuthenticated, supportTicket_validator_1.default.getAllTickets(), validation_middleware_1.default, supportTicket_controllers_1.default.getAllTickets);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new SupportTicketRouter().getRouter();
