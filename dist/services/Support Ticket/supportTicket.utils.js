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
exports.DeleteFilesFromFTP = DeleteFilesFromFTP;
const ftp_services_1 = require("../FtpFileUpload/ftp.services");
function DeleteFilesFromFTP(fileUrls) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fileUrls || fileUrls.length === 0)
            return;
        try {
            const deletePromises = fileUrls.map(url => {
                const fileName = url.split('/').pop();
                if (fileName) {
                    return ftp_services_1.ftpUploader.deleteFile(`tickets/${fileName}`);
                }
                return Promise.resolve();
            });
            yield Promise.all(deletePromises);
        }
        catch (error) {
            console.error('Error deleting ticket attachments:', error);
            throw error;
        }
    });
}
