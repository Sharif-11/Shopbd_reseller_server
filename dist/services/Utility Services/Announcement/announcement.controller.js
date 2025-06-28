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
const announcement_service_1 = __importDefault(require("./announcement.service"));
class AnnouncementController {
    /**
     * Get all current announcements
     */
    getAnnouncements(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const announcements = yield announcement_service_1.default.getCurrentAnnouncements();
                res.status(200).json({
                    statusCode: 200,
                    message: 'Announcements retrieved successfully',
                    success: true,
                    data: announcements,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Completely replace all announcements (PUT operation)
     */
    updateAnnouncements(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Assuming userId is available in req.user
                const { announcements } = req.body; // Expecting array of strings
                console.clear();
                console.log('Received announcements:', announcements);
                const updated = yield announcement_service_1.default.replaceAllAnnouncements(userId, announcements);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Announcements updated successfully',
                    success: true,
                    data: updated,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new AnnouncementController();
