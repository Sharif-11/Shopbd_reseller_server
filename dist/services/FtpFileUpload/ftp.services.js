"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.FTPUploader = exports.ftpUploader = void 0;
const ftp = __importStar(require("basic-ftp"));
const stream_1 = __importDefault(require("stream"));
const config_1 = __importDefault(require("../../config"));
class FTPUploader {
    constructor(config) {
        this.client = new ftp.Client();
        // this.client.ftp.verbose = true // Enable for debugging
        this.config = Object.assign({ secure: false }, config);
    }
    /**
     * Uploads a file buffer to FTP server
     * @param fileBuffer The file content as Buffer
     * @param remoteFileName Destination file name on FTP server
     * @returns URL of the uploaded file
     */
    upload(fileBuffer, remoteFileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.connect();
                yield this.uploadFile(fileBuffer, remoteFileName);
                return this.getFileUrl(remoteFileName);
            }
            finally {
                this.close();
            }
        });
    }
    deleteFile(remoteFileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.connect();
                yield this.client.remove(remoteFileName);
            }
            catch (error) {
                console.error(`Failed to delete file ${remoteFileName}:`, error);
                throw error;
            }
            finally {
                this.close();
            }
        });
    }
    /**
     * Connects to FTP server
     */
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.access({
                host: this.config.host,
                user: this.config.user,
                password: this.config.password,
                secure: this.config.secure,
            });
        });
    }
    /**
     * Uploads file buffer to FTP
     * @param fileBuffer File content as Buffer
     * @param remoteFileName Destination file name
     */
    uploadFile(fileBuffer, remoteFileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const bufferStream = new stream_1.default.PassThrough();
            bufferStream.end(fileBuffer);
            yield this.client.uploadFrom(bufferStream, remoteFileName);
        });
    }
    /**
     * Generates public URL for the uploaded file
     * @param fileName File name on FTP server
     * @returns Full public URL
     */
    getFileUrl(fileName) {
        return `${this.config.baseUrl}/${fileName}`;
    }
    /**
     * Downloads a file from FTP server
     *
     */
    download(fileUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.connect();
                const fileName = this.extractFileNameFromUrl(fileUrl);
                return yield this.downloadFile(fileName);
            }
            finally {
                this.close();
            }
        });
    }
    /**
     * Downloads multiple files from the FTP server by their URLs
     * @param fileUrls Array of file URLs to download
     * @returns Array of file contents as Buffers
     */
    downloadMultiple(fileUrls) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.connect();
                const downloadPromises = fileUrls.map(url => {
                    const fileName = this.extractFileNameFromUrl(url);
                    return this.downloadFile(fileName);
                });
                return yield Promise.all(downloadPromises);
            }
            finally {
                this.close();
            }
        });
    }
    /**
     * Extracts the file name from a given URL
     * @param url The file URL
     * @returns The file name
     */
    extractFileNameFromUrl(url) {
        const urlObj = new URL(url);
        return urlObj.pathname.split('/').pop() || '';
    }
    /**
     * Downloads a file from FTP server
     * @param fileName Name of the file to download
     * @returns File content as Buffer
     */
    downloadFile(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const writableStream = new stream_1.default.PassThrough();
            const chunks = [];
            writableStream.on('data', chunk => chunks.push(chunk));
            yield this.client.downloadTo(writableStream, fileName);
            return Buffer.concat(chunks);
        });
    }
    /**
     * Closes FTP connection
     */
    close() {
        this.client.close();
    }
}
exports.FTPUploader = FTPUploader;
// Example usage:
/*
const ftpUploader = new FTPUploader({
  host: 'your-ftp-host',
  user: 'your-username',
  password: 'your-password',
  baseUrl: 'http://admin.shopbdresellerjobs.shop/ftp_admin'
});

const fileBuffer = Buffer.from('some file content');
const url = await ftpUploader.upload(fileBuffer, 'test.txt');

*/
const ftpUploader = new FTPUploader({
    host: config_1.default.ftpHost,
    user: config_1.default.ftpUser,
    password: config_1.default.ftpPassword,
    baseUrl: config_1.default.ftpBaseUrl,
    secure: false, // Set to true if using FTPS
});
exports.ftpUploader = ftpUploader;
