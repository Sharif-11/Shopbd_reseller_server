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
exports.verifyPermission = exports.verifyRole = exports.authenticate = exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const user_services_1 = __importDefault(require("../services/UserManagement/user.services"));
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
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    // console.log({meta:req?.body?.meta})
    if (!token) {
        next();
    }
    else {
        try {
            const payload = jsonwebtoken_1.default.verify(token, config_1.default.jwtSecret);
            // check if user with userId exists
            const { userId } = payload;
            const user = yield prisma_1.default.user.findUnique({
                where: { userId },
            });
            if (!user) {
                next();
            }
            else {
                req.user = payload;
                next();
            }
        }
        catch (error) {
            next(new ApiError_1.default(401, 'Unauthorized'));
        }
    }
});
exports.authenticate = authenticate;
const verifyRole = (role) => {
    return (req, res, next) => {
        var _a, _b, _c;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.role)) {
            return next(new ApiError_1.default(401, 'Unauthorized'));
        }
        if (Array.isArray(role)
            ? !role.includes((_b = req.user) === null || _b === void 0 ? void 0 : _b.role)
            : ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) !== role) {
            return next(new ApiError_1.default(403, 'Forbidden'));
        }
        next();
    };
};
exports.verifyRole = verifyRole;
const verifyPermission = (permissionType, actionType) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                throw new ApiError_1.default(401, 'Unauthorized');
            }
            // Verify the user has the required permission
            yield user_services_1.default.verifyUserPermission(userId, permissionType, actionType);
            // If verification succeeds, proceed to next middleware
            next();
        }
        catch (error) {
            // Pass any errors to the error handling middleware
            next(error);
        }
    });
};
exports.verifyPermission = verifyPermission;
