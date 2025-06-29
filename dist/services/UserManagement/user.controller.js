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
const user_services_1 = __importDefault(require("./user.services"));
class UserManagementController {
    /**
     * Create the first super admin (initial setup)
     */
    createFirstSuperAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { phoneNo, name, password, email } = req.body;
                const user = yield user_services_1.default.createFirstSuperAdmin({
                    phoneNo,
                    name,
                    password,
                    email,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Super Admin created successfully',
                    success: true,
                    data: user,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Create a new super admin
     */
    createSuperAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const currentAdminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Assuming user ID is in request after auth middleware
                const { phoneNo, name, password, email } = req.body;
                const user = yield user_services_1.default.createSuperAdmin(currentAdminId, {
                    phoneNo,
                    name,
                    password,
                    email,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Super Admin created successfully',
                    success: true,
                    data: user,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Create a new admin
     */
    createAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const currentAdminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { phoneNo, name, password, email } = req.body;
                console.log(currentAdminId);
                const user = yield user_services_1.default.createAdmin(currentAdminId, {
                    phoneNo,
                    name,
                    password,
                    email,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Admin created successfully',
                    success: true,
                    data: user,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Create a new seller
     */
    createSeller(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { phoneNo, name, password, email, zilla, upazilla, address, shopName, nomineePhone, facebookProfileLink, referralCode, } = req.body;
                const user = yield user_services_1.default.createSeller({
                    phoneNo,
                    name,
                    password,
                    email,
                    zilla,
                    upazilla,
                    address,
                    shopName,
                    nomineePhone,
                    facebookProfileLink,
                    referralCode,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Seller created successfully',
                    success: true,
                    data: user,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Create a new customer
     */
    createCustomer(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { customerName, customerPhoneNo, sellerCode } = req.body;
                const customer = yield user_services_1.default.createCustomer({
                    customerName,
                    customerPhoneNo,
                    sellerCode,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Customer created successfully',
                    success: true,
                    data: customer,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Demote a super admin to admin
     */
    demoteSuperAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const currentAdminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { superAdminId } = req.body;
                const user = yield user_services_1.default.demoteSuperAdminToAdmin(currentAdminId, superAdminId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Super Admin demoted to Admin successfully',
                    success: true,
                    data: user,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Promote an admin to super admin
     */
    promoteAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const currentAdminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { adminId } = req.body;
                console.log({
                    currentAdminId,
                    adminId,
                });
                const user = yield user_services_1.default.promoteAdminToSuperAdmin(currentAdminId, adminId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Admin promoted to Super Admin successfully',
                    success: true,
                    data: user,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * User login
     */
    login(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { phoneNo, password } = req.body;
                const { user, token } = yield user_services_1.default.login({
                    phoneNo,
                    password,
                });
                // set token in cookie with secure and httpOnly flags
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Login successful',
                    success: true,
                    data: {
                        user,
                        token,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    adminLogin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { phoneNo, password } = req.body;
                const { user, token } = yield user_services_1.default.adminLogin({
                    phoneNo,
                    password,
                });
                // set token in cookie with secure and httpOnly flags
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Login successful',
                    success: true,
                    data: {
                        user,
                        token,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * User logout
     */
    logout(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Clear the cookie
                res.clearCookie('token');
                res.status(200).json({
                    statusCode: 200,
                    message: 'Logout successful',
                    success: true,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     *  check already logged in user
     */
    checkLoggedInUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const user = yield user_services_1.default.checkLoggedInUser(userId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'User is logged in',
                    success: true,
                    data: user,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Reset password
     */
    resetPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { phoneNo } = req.body;
                const user = yield user_services_1.default.resetPassword(phoneNo);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Password reset successful. New password sent to your phone',
                    success: true,
                    data: user,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get user profile
     */
    getProfile(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const user = yield user_services_1.default.getProfile(userId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Profile retrieved successfully',
                    success: true,
                    data: user,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Update user profile
     */
    updateProfile(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const updates = req.body;
                const user = yield user_services_1.default.updateProfile(userId, updates);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Profile updated successfully',
                    success: true,
                    data: user,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Change password
     */
    changePassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { currentPassword, newPassword } = req.body;
                const user = yield user_services_1.default.changePassword({
                    userId: userId,
                    currentPassword,
                    newPassword,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Password changed successfully',
                    success: true,
                    data: user,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Create a new role
     */
    createRole(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const creatorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { roleName, description, isDefault } = req.body;
                const role = yield user_services_1.default.createRole(creatorId, {
                    roleName,
                    description,
                    isDefault,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Role created successfully',
                    success: true,
                    data: role,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Assign permission to role
     */
    assignPermissionToRole(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { roleId, permission, actions } = req.body;
                console.log('Assigning permission to role:', {
                    adminId,
                    roleId,
                    permission,
                    actions,
                });
                const rolePermission = yield user_services_1.default.assignPermissionToRole(adminId, {
                    roleId,
                    permission,
                    actions,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Permission assigned to role successfully',
                    success: true,
                    data: rolePermission,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    assignMultiplePermissionsToRole(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { roleId, permissions, actions } = req.body;
                const rolePermissions = yield user_services_1.default.assignMultiplePermissionsToRole(adminId, {
                    roleId,
                    permissions,
                    actions,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Permissions assigned to role successfully',
                    success: true,
                    data: rolePermissions,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Assign role to user
     */
    assignRoleToUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { userId, roleId } = req.body;
                const userRole = yield user_services_1.default.assignRoleToUser(adminId, {
                    userId,
                    roleId,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Role assigned to user successfully',
                    success: true,
                    data: userRole,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Block a user
     */
    /**
     * Check if user is blocked for specific action
     */
    /**
     * Add referral code to the seller
     */
    addReferralCodeToSeller(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { referralCode } = req.body;
                const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const updatedSeller = yield user_services_1.default.addReferralCodeToSeller(sellerId, referralCode);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Referral code added successfully',
                    success: true,
                    data: updatedSeller,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getAllUsers(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const currentAdminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Assuming user ID is in request
                //after auth middleware
                const { page = 1, limit = 10, role, searchTerm } = req.query;
                const users = yield user_services_1.default.getAllUsers(Object.assign({ adminId: currentAdminId }, req.query));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Users retrieved successfully',
                    success: true,
                    data: users,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    checkSuperAdminExists(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const exists = yield user_services_1.default.checkSuperAdminExists();
                res.status(200).json({
                    statusCode: 200,
                    message: 'Super Admin existence checked successfully',
                    success: true,
                    data: { exists },
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    sendDirectMessage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { content } = req.body;
                const { userId } = req.params;
                const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const result = yield user_services_1.default.sendDirectMessage(senderId, userId, content);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Message sent successfully',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new UserManagementController();
