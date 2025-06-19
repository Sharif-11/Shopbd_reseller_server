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
const block_services_1 = require("./block.services");
class BlockController {
    /**
     * Get all blocked actions for a user
     */
    getBlockedActions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { phoneNo } = req.params;
                const blockedActions = yield block_services_1.blockServices.getUserBlockStatus(adminId, phoneNo);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Blocked actions retrieved successfully',
                    success: true,
                    data: blockedActions,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Update user block actions (single endpoint for both block/unblock)
     */
    updateBlockActions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { phoneNo } = req.params;
                const { actions } = req.body;
                console.log(actions);
                const result = yield block_services_1.blockServices.updateUserBlockActions(adminId, phoneNo, actions);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Block actions updated successfully',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Check if user is blocked for specific action
     */
    checkBlockStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { phoneNo } = req.params;
                const { actionType } = req.query;
                const isBlocked = yield block_services_1.blockServices.isUserBlocked(phoneNo, actionType);
                res.status(200).json({
                    statusCode: 200,
                    message: isBlocked ? 'User is blocked' : 'User is not blocked',
                    success: true,
                    data: isBlocked,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new BlockController();
