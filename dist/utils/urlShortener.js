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
const axios_1 = __importDefault(require("axios"));
// Function to shorten URL using tinyurl API
function shortenUrl(originalUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const encodedUrl = encodeURIComponent(originalUrl);
            const apiUrl = `https://tinyurl.com/api-create.php?url=${encodedUrl}`;
            const response = yield axios_1.default.get(apiUrl, {
                timeout: 5000, // 5 second timeout
                headers: {
                    'User-Agent': 'Node.js URL Shortener',
                },
            });
            // Check if the response contains a valid shortened URL
            if (response.status === 200 &&
                response.data &&
                response.data.startsWith('http')) {
                return response.data;
            }
            else {
                throw new Error('Invalid response from tinyurl API');
            }
        }
        catch (error) {
            console.error('URL shortening failed:', error);
            // Return original URL if shortening fails
            return originalUrl;
        }
    });
}
