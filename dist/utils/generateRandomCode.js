"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomCode = generateRandomCode;
function generateRandomCode(length = 5) {
    const firstChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789';
    const otherChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = firstChars.charAt(Math.floor(Math.random() * firstChars.length));
    for (let i = 1; i < length; i++) {
        result += otherChars.charAt(Math.floor(Math.random() * otherChars.length));
    }
    return result;
}
