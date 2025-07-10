"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const ftp_controller_1 = require("./ftp.controller");
class FTPRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        // Initialize multer for file uploads such that it accepts only image and maximum 5 MB size
        this.upload = (0, multer_1.default)({
            storage: multer_1.default.memoryStorage(), // Store files in memory
            limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5 MB
            fileFilter: (req, file, cb) => {
                // Accept only images
                if (!file.mimetype.startsWith('image/')) {
                    return cb(new Error('Only image files are allowed'));
                }
                cb(null, true);
            },
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Single file upload
        this.router.post('/upload', this.upload.single('image'), // Expect a single file with field name 'image'
        ftp_controller_1.ftpController.uploadFile);
        this.router.post('/download', ftp_controller_1.ftpController.downloadFile);
        // Add this to your initializeRoutes method in FTPRouter
        this.router.delete('/delete/:fileName', ftp_controller_1.ftpController.deleteFile);
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new FTPRouter().getRouter();
