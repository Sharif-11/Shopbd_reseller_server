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
exports.ftpController = void 0;
const uuid_1 = require("uuid");
const ftp_services_1 = require("./ftp.services");
class FTPController {
    constructor(uploader) {
        this.uploader = uploader;
        this.uploadFile = this.uploadFile.bind(this);
        this.processUpload = this.processUpload.bind(this);
        this.sendSuccessResponse = this.sendSuccessResponse.bind(this);
        this.sendErrorResponse = this.sendErrorResponse.bind(this);
        this.handleUploadError = this.handleUploadError.bind(this);
        this.deleteFile = this.deleteFile.bind(this);
    }
    /**
     * Handles file upload via HTTP POST
     * @param req Express Request
     * @param res Express Response
     */
    uploadFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.file) {
                return this.sendErrorResponse(res, 400, 'No file uploaded');
            }
            try {
                const fileInfo = yield this.processUpload(req.file);
                this.sendSuccessResponse(res, fileInfo);
            }
            catch (error) {
                // console.log('Error processing file upload:', error)
                this.handleUploadError(res, error);
            }
        });
    }
    // Add this to your FTPController class
    deleteFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fileName } = req.params;
            if (!fileName) {
                return this.sendErrorResponse(res, 400, 'File name is required');
            }
            try {
                yield this.uploader.deleteFile(fileName);
                res.json({
                    statusCode: 200,
                    success: true,
                    message: 'File deleted successfully',
                    data: {
                        fileName,
                        deletedAt: new Date().toISOString(),
                    },
                });
            }
            catch (error) {
                console.error('FTP delete error:', error);
                const message = error instanceof Error ? error.message : 'Unknown error';
                this.sendErrorResponse(res, 500, `Failed to delete file: ${message}`);
            }
        });
    }
    /**
     * Processes the file upload
     * @param file Express Multer file object
     * @returns Uploaded file information
     */
    processUpload(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const originalName = file.originalname;
            const extension = originalName.split('.').pop();
            const uniqueName = `${(0, uuid_1.v4)()}.${extension}`;
            const publicUrl = yield this.uploader.upload(file.buffer, uniqueName);
            return {
                originalName,
                fileName: uniqueName,
                size: file.size,
                mimeType: file.mimetype,
                publicUrl,
                uploadedAt: new Date().toISOString(),
            };
        });
    }
    /**
     * Sends a successful response
     * @param res Express Response
     * @param data Response data
     */
    sendSuccessResponse(res, data) {
        res.json({
            statusCode: 200,
            success: true,
            message: 'File uploaded successfully',
            data,
        });
    }
    /**
     * Sends an error response
     * @param res Express Response
     * @param statusCode HTTP status code
     * @param message Error message
     */
    sendErrorResponse(res, statusCode, message) {
        res.status(statusCode).json({
            statusCode,
            success: false,
            message,
        });
    }
    /**
     * Handles upload errors
     * @param res Express Response
     * @param error Error object
     */
    handleUploadError(res, error) {
        console.error('FTP upload error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.sendErrorResponse(res, 500, `Failed to upload file: ${message}`);
    }
}
exports.ftpController = new FTPController(ftp_services_1.ftpUploader);
