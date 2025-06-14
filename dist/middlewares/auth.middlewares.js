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
exports.verifyRole = exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const isAuthenticated = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    // console.log({meta:req?.body?.meta})
    if (!token) {
        return next(new ApiError_1.default(401, 'Unauthorized'));
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.default.jwtSecret);
        // check if user with userId exists
        const { userId } = payload;
        const user = yield prisma_1.default.user.findUnique({
            where: { userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
        req.user = payload;
        next();
    }
    catch (error) {
        next(new ApiError_1.default(401, 'Unauthorized'));
    }
});
exports.isAuthenticated = isAuthenticated;
const verifyRole = (role) => {
    return (req, res, next) => {
        var _a;
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== role) {
            return next(new ApiError_1.default(403, 'Forbidden'));
        }
        next();
    };
};
exports.verifyRole = verifyRole;
