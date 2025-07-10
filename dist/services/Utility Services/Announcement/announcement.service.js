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
exports.AnnouncementService = void 0;
const client_1 = require("@prisma/client");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const prisma_1 = __importDefault(require("../../../utils/prisma"));
const user_services_1 = __importDefault(require("../../UserManagement/user.services"));
class AnnouncementService {
    ensureSingleRowExists() {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield prisma_1.default.announcements.findFirst();
            if (!existing) {
                yield prisma_1.default.announcements.create({
                    data: {
                        announcements: [],
                    },
                });
            }
        });
    }
    replaceAllAnnouncements(adminId, newAnnouncements) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.OTHER, client_1.ActionType.ALL);
            try {
                // Ensure the single row exists
                yield this.ensureSingleRowExists();
                // Get the existing record (we know it exists after ensureSingleRowExists)
                const existing = yield prisma_1.default.announcements.findFirstOrThrow();
                // Completely replace the announcements array
                const updated = yield prisma_1.default.announcements.update({
                    where: { id: existing.id },
                    data: {
                        announcements: newAnnouncements,
                    },
                });
                return updated.announcements;
            }
            catch (error) {
                throw new ApiError_1.default(400, 'Failed to update announcements');
            }
        });
    }
    getCurrentAnnouncements() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.ensureSingleRowExists();
                const result = yield prisma_1.default.announcements.findFirstOrThrow();
                return result.announcements;
            }
            catch (error) {
                throw new ApiError_1.default(400, 'Failed to fetch announcements');
            }
        });
    }
}
exports.AnnouncementService = AnnouncementService;
exports.default = new AnnouncementService();
