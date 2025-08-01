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
exports.supportTicketService = void 0;
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const ftp_services_1 = require("../FtpFileUpload/ftp.services");
const user_services_1 = __importDefault(require("../UserManagement/user.services"));
class SupportTicketService {
    constructor() {
        this.deleteTickets = (adminId_1, ...args_1) => __awaiter(this, [adminId_1, ...args_1], void 0, function* (adminId, days = 7) {
            yield user_services_1.default.verifyUserPermission(adminId, 'SUPPORT_TICKET_MANAGEMENT', 'DELETE');
            if (days < 1) {
                throw new ApiError_1.default(400, 'Days must be a positive integer');
            }
            // I need to delete tickets that are older than the specified number of days along with their messages and attachments
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);
            const ticketsToDelete = yield prisma_1.default.supportTicket.findMany({
                where: {
                    createdAt: {
                        lt: dateThreshold,
                    },
                },
                include: {
                    messages: true,
                },
            });
            if (ticketsToDelete.length === 0) {
                return { message: 'No tickets to delete' };
            }
            const attachmentUrls = [];
            for (const ticket of ticketsToDelete) {
                for (const message of ticket.messages) {
                    if (message.attachments && message.attachments.length > 0) {
                        attachmentUrls.push(...message.attachments);
                    }
                }
            }
            // Delete attachments from FTP server
            try {
                yield ftp_services_1.ftpUploader.deleteFilesWithUrls(attachmentUrls);
            }
            catch (error) {
                console.error('Error deleting attachments from FTP:', error);
            }
            // Delete messages and tickets
            yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                for (const ticket of ticketsToDelete) {
                    yield tx.ticketMessage.deleteMany({
                        where: { ticketId: ticket.ticketId },
                    });
                    yield tx.supportTicket.delete({
                        where: { ticketId: ticket.ticketId },
                    });
                }
            }));
        });
    }
    validateTicketOwnership(ticketId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const ticket = yield prisma_1.default.supportTicket.findUnique({
                where: { ticketId },
            });
            if (!ticket) {
                throw new ApiError_1.default(404, 'Ticket not found');
            }
            if (ticket.userId !== userId) {
                throw new ApiError_1.default(403, 'You are not authorized to access this ticket');
            }
            return ticket;
        });
    }
    validateAdminAccess(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, 'SUPPORT_TICKET_MANAGEMENT', 'READ');
        });
    }
    validateTicketNotClosed(ticketId) {
        return __awaiter(this, void 0, void 0, function* () {
            const ticket = yield prisma_1.default.supportTicket.findUnique({
                where: { ticketId },
            });
            if (!ticket) {
                throw new ApiError_1.default(404, 'Ticket not found');
            }
            if (ticket.status === 'CLOSED') {
                throw new ApiError_1.default(400, 'Cannot modify a closed ticket');
            }
            return ticket;
        });
    }
    validateAttachmentUrls(attachmentUrls = []) {
        if (attachmentUrls.length > 5) {
            throw new ApiError_1.default(400, 'Maximum 5 attachments allowed');
        }
        for (const url of attachmentUrls) {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                throw new ApiError_1.default(400, 'Invalid attachment URL format');
            }
        }
    }
    createTicket(userId_1, _a) {
        return __awaiter(this, arguments, void 0, function* (userId, { subject, category, priority, message, attachmentUrls = [], orderId, paymentId, productId, }) {
            const user = yield user_services_1.default.getUserById(userId);
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            // Validate attachments
            this.validateAttachmentUrls(attachmentUrls);
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const ticket = yield tx.supportTicket.create({
                    data: {
                        subject,
                        category: category,
                        priority: priority || 'MEDIUM',
                        userId: user.userId,
                        userType: user.role,
                        userName: user.name,
                        userPhone: user.phoneNo,
                        userEmail: user.email,
                        shopName: user.shopName,
                        orderId,
                        paymentId,
                        productId,
                    },
                });
                yield tx.ticketMessage.create({
                    data: {
                        ticketId: ticket.ticketId,
                        senderId: user.userId,
                        senderType: 'SELLER',
                        senderName: user.name,
                        senderEmail: user.email,
                        content: message,
                        attachments: attachmentUrls,
                    },
                });
                return ticket;
            }));
        });
    }
    replyToTicket(userId_1, _a) {
        return __awaiter(this, arguments, void 0, function* (userId, { ticketId, message, attachmentUrls = [], senderType, }) {
            const user = yield user_services_1.default.getUserById(userId);
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            // Validate ticket exists and not closed
            const ticket = yield this.validateTicketNotClosed(ticketId);
            // Validate attachments
            this.validateAttachmentUrls(attachmentUrls);
            // Update ticket status based on who is replying
            let statusUpdate = ticket.status;
            if (senderType === 'SELLER') {
                statusUpdate = 'WAITING_RESPONSE';
            }
            else if (senderType === 'SYSTEM') {
                statusUpdate = 'IN_PROGRESS';
            }
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                yield tx.supportTicket.update({
                    where: { ticketId },
                    data: {
                        status: statusUpdate,
                        updatedAt: new Date(),
                    },
                });
                const newMessage = yield tx.ticketMessage.create({
                    data: {
                        ticketId,
                        senderId: user.userId,
                        senderType,
                        senderName: user.name,
                        senderEmail: user.email,
                        content: message,
                        attachments: attachmentUrls,
                    },
                });
                return newMessage;
            }));
        });
    }
    closeTicket(userId, ticketId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_services_1.default.getUserById(userId);
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            // Only admin can close tickets
            yield this.validateAdminAccess(userId);
            const ticket = yield this.validateTicketNotClosed(ticketId);
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Close the ticket (keeping metadata)
                // At first we need to delete the ticket messages and the attachments from ftp server
                // retreive all attachments urls
                const messages = yield tx.ticketMessage.findMany({
                    where: { ticketId },
                });
                try {
                    const attachmentUrls = messages.flatMap(msg => msg.attachments || []);
                    // loop through the urls and delete them from ftp server
                    yield ftp_services_1.ftpUploader.deleteFilesWithUrls(attachmentUrls);
                }
                catch (error) {
                    console.log('Error deleting attachments from FTP:', error);
                }
                // delete all messages except the last one
                // we will keep the last message as a record of the closure
                const lastMessage = messages[messages.length - 1];
                if (lastMessage) {
                    yield tx.ticketMessage.deleteMany({
                        where: {
                            ticketId,
                            messageId: { not: lastMessage.messageId },
                        },
                    });
                }
                const closedTicket = yield tx.supportTicket.update({
                    where: { ticketId },
                    data: {
                        status: 'CLOSED',
                        closedAt: new Date(),
                        closedBy: user.userId,
                    },
                });
                return closedTicket;
            }));
        });
    }
    getTicketDetails(ticketId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const ticket = yield prisma_1.default.supportTicket.findUnique({
                where: { ticketId },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            if (!ticket) {
                throw new ApiError_1.default(404, 'Ticket not found');
            }
            // Only ticket owner or admin can view
            if (ticket.userId !== userId) {
                yield this.validateAdminAccess(userId);
            }
            return ticket;
        });
    }
    getUserTickets(userId_1, _a) {
        return __awaiter(this, arguments, void 0, function* (userId, { status, page = 1, limit = 10, search, }) {
            const skip = (page - 1) * limit;
            const where = { userId };
            if (status) {
                where.status = Array.isArray(status) ? { in: status } : status;
            }
            if (search) {
                where.OR = [
                    { subject: { contains: search, mode: 'insensitive' } },
                    { shopName: { contains: search, mode: 'insensitive' } },
                ];
            }
            const [tickets, total] = yield Promise.all([
                prisma_1.default.supportTicket.findMany({
                    where,
                    orderBy: { updatedAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma_1.default.supportTicket.count({ where }),
            ]);
            return {
                tickets,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        });
    }
    getAllTickets(adminId_1, _a) {
        return __awaiter(this, arguments, void 0, function* (adminId, { status, page = 1, limit = 10, search, priority, category, }) {
            yield this.validateAdminAccess(adminId);
            const skip = (page - 1) * limit;
            const where = {};
            if (status) {
                where.status = Array.isArray(status) ? { in: status } : status;
            }
            if (priority) {
                where.priority = Array.isArray(priority) ? { in: priority } : priority;
            }
            if (category) {
                where.category = Array.isArray(category) ? { in: category } : category;
            }
            if (search) {
                where.OR = [
                    { subject: { contains: search, mode: 'insensitive' } },
                    { shopName: { contains: search, mode: 'insensitive' } },
                    { userPhone: { contains: search, mode: 'insensitive' } },
                    { userName: { contains: search, mode: 'insensitive' } },
                ];
            }
            const [tickets, total] = yield Promise.all([
                prisma_1.default.supportTicket.findMany({
                    where,
                    orderBy: { updatedAt: 'desc' },
                    skip,
                    take: limit,
                    include: {
                        messages: {
                            orderBy: { createdAt: 'asc' },
                            take: 1, // Only get the first message for listing
                        },
                    },
                }),
                prisma_1.default.supportTicket.count({ where }),
            ]);
            return {
                tickets,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        });
    }
}
exports.supportTicketService = new SupportTicketService();
