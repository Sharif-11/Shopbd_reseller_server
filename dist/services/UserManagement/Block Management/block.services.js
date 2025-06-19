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
exports.blockServices = void 0;
const client_1 = require("@prisma/client");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const prisma_1 = __importDefault(require("../../../utils/prisma"));
const user_services_1 = __importDefault(require("../../UserManagement/user.services"));
class BlockService {
    /**
     * Get all block actions for a user with their individual attributes
     */
    getUserBlockStatus(adminId, userPhoneNo) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.USER_MANAGEMENT, 'READ');
            const user = yield prisma_1.default.user.findUnique({
                where: { phoneNo: userPhoneNo },
            });
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            const block = yield prisma_1.default.block.findFirst({
                where: {
                    userPhoneNo,
                    isActive: true,
                },
                include: {
                    actions: true,
                },
            });
            return {
                user: {
                    name: user.name,
                    phoneNo: userPhoneNo,
                    userId: user.userId,
                },
                blockId: block === null || block === void 0 ? void 0 : block.blockId,
                actions: (_a = block === null || block === void 0 ? void 0 : block.actions) !== null && _a !== void 0 ? _a : [],
            };
        });
    }
    /**
     * Update block actions for a user with individual attributes
     */
    updateUserBlockActions(adminId, userPhoneNo, actions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.USER_MANAGEMENT, client_1.ActionType.BLOCK);
            const user = yield prisma_1.default.user.findUnique({
                where: { phoneNo: userPhoneNo },
            });
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Find or create the main block record
                let block = yield tx.block.findFirst({
                    where: { userPhoneNo },
                });
                if (!block) {
                    block = yield tx.block.create({
                        data: {
                            userName: user.name,
                            userPhoneNo,
                            isActive: false, // Will be activated if any actions are added
                        },
                    });
                }
                // Process each action
                for (const action of actions) {
                    if (action.active) {
                        // Upsert the action (create or update)
                        yield tx.blockAction.upsert({
                            where: {
                                blockId_actionType: {
                                    blockId: block.blockId,
                                    actionType: action.actionType,
                                },
                            },
                            create: {
                                blockId: block.blockId,
                                actionType: action.actionType,
                                reason: action.reason,
                                expiresAt: action.expiresAt,
                            },
                            update: {
                                reason: action.reason,
                                expiresAt: action.expiresAt,
                            },
                        });
                    }
                    else {
                        // Remove the action if it exists
                        yield tx.blockAction.deleteMany({
                            where: {
                                blockId: block.blockId,
                                actionType: action.actionType,
                            },
                        });
                    }
                }
                // Update the block's active status based on whether it has any actions
                const actionCount = yield tx.blockAction.count({
                    where: { blockId: block.blockId },
                });
                yield tx.block.update({
                    where: { blockId: block.blockId },
                    data: {
                        isActive: actionCount > 0,
                        updatedAt: new Date(),
                    },
                });
                return this.getUserBlockStatus(adminId, userPhoneNo);
            }));
        });
    }
    /**
     * Check if a user is blocked for a specific action
     */
    isUserBlocked(userPhoneNo, actionType) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield prisma_1.default.blockAction.findFirst({
                where: {
                    block: {
                        userPhoneNo,
                        isActive: true,
                    },
                    actionType: {
                        in: [actionType, client_1.BlockActionType.ALL], // Check for specific action or ALL
                    },
                    OR: [
                        { expiresAt: { gt: new Date() } },
                        { expiresAt: null }, // Never-expiring blocks
                    ],
                },
                select: {
                    reason: true,
                    expiresAt: true,
                },
            });
            return !!result;
        });
    }
}
exports.blockServices = new BlockService();
