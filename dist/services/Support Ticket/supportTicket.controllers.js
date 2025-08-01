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
Object.defineProperty(exports, "__esModule", { value: true });
const supportTicket_services_1 = require("./supportTicket.services");
class SupportTicketController {
    createTicket(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { subject, category, priority, message, attachmentUrls = [], orderId, paymentId, productId, } = req.body;
                const ticket = yield supportTicket_services_1.supportTicketService.createTicket(userId, {
                    subject,
                    category,
                    priority,
                    message,
                    attachmentUrls: Array.isArray(attachmentUrls)
                        ? attachmentUrls
                        : [attachmentUrls],
                    orderId,
                    paymentId,
                    productId,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Ticket created successfully',
                    success: true,
                    data: ticket,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    replyToTicket(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { ticketId, message, attachmentUrls = [] } = req.body;
                const senderType = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'Seller' ? 'SELLER' : 'SYSTEM';
                const newMessage = yield supportTicket_services_1.supportTicketService.replyToTicket(userId, {
                    ticketId,
                    message,
                    attachmentUrls: Array.isArray(attachmentUrls)
                        ? attachmentUrls
                        : [attachmentUrls],
                    senderType,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Reply added successfully',
                    success: true,
                    data: newMessage,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    closeTicket(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { ticketId } = req.params;
                const ticket = yield supportTicket_services_1.supportTicketService.closeTicket(userId, ticketId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Ticket closed successfully',
                    success: true,
                    data: ticket,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getTicketDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { ticketId } = req.params;
                const ticket = yield supportTicket_services_1.supportTicketService.getTicketDetails(ticketId, userId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Ticket details retrieved successfully',
                    success: true,
                    data: ticket,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getUserTickets(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { status, page, limit, search } = req.query;
                const tickets = yield supportTicket_services_1.supportTicketService.getUserTickets(userId, {
                    status: status,
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined,
                    search: search,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Tickets retrieved successfully',
                    success: true,
                    data: tickets,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getAllTickets(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { status, page, limit, search, priority, category } = req.query;
                const tickets = yield supportTicket_services_1.supportTicketService.getAllTickets(userId, {
                    status: status,
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined,
                    search: search,
                    priority: priority,
                    category: category,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Tickets retrieved successfully',
                    success: true,
                    data: tickets,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    deleteTickets(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { days } = req.query;
                yield supportTicket_services_1.supportTicketService.deleteTickets(adminId, days ? Number(days) : 7);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Old tickets deleted successfully',
                    success: true,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new SupportTicketController();
