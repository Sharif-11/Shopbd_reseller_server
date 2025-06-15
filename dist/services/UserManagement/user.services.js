"use strict";
// ==========================================
// TYPE DEFINITIONS
// ==========================================
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const otp_services_1 = __importDefault(require("../otp/otp.services"));
class UserManagementServices {
    // create a private method to hash passwords
    hashPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            return bcryptjs_1.default.hash(password, Number(config_1.default.saltRounds));
        });
    }
    comparePassword(_a) {
        return __awaiter(this, arguments, void 0, function* ({ password, hash, }) {
            return bcryptjs_1.default.compare(password, hash);
        });
    }
    generateRandomPassword(length = 6) {
        // the password must be numeric
        const digits = '0123456789';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += digits.charAt(Math.floor(Math.random() * digits.length));
        }
        return password;
    }
    generateAccessToken(userId, role, phoneNo) {
        const payload = { userId, role, phoneNo };
        return jsonwebtoken_1.default.sign(payload, config_1.default.jwtSecret); // Token expires in 1 hour
    }
    // ==========================================
    // USER CREATION METHODS
    // ==========================================
    /**
     * Create the first super admin (special method for initial setup)
     */
    createFirstSuperAdmin(input) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if any super admin already exists
            const existingSuperAdmin = yield prisma_1.default.user.findFirst({
                where: { role: client_1.UserType.SuperAdmin },
            });
            if (existingSuperAdmin) {
                throw new ApiError_1.default(400, 'A Super Admin already exists');
            }
            const hashedPassword = yield this.hashPassword(input.password);
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Create super admin role if not exists
                const superAdminRole = yield tx.role.upsert({
                    where: { roleName: 'SuperAdmin' },
                    update: {},
                    create: {
                        roleName: 'SuperAdmin',
                        roleDescription: 'System super administrator with all permissions',
                        isDefault: false,
                    },
                });
                // Create the user
                const user = yield tx.user.create({
                    data: {
                        phoneNo: input.phoneNo,
                        name: input.name,
                        password: hashedPassword,
                        email: input.email,
                        role: client_1.UserType.SuperAdmin,
                        isVerified: true,
                    },
                });
                // Assign role to user
                yield tx.userRole.create({
                    data: {
                        userId: user.userId,
                        roleId: superAdminRole.roleId,
                    },
                });
                // Assign all permissions to super admin role
                const allPermissions = Object.values(client_1.PermissionType);
                for (const permission of allPermissions) {
                    yield tx.rolePermission.create({
                        data: {
                            roleId: superAdminRole.roleId,
                            permission,
                            actions: [client_1.ActionType.ALL],
                        },
                    });
                }
                // return user without password
                const { password } = user, userWithoutPassword = __rest(user, ["password"]);
                return userWithoutPassword;
            }));
        });
    }
    /**
     * Create a new super admin (can only be done by existing super admin)
     */
    createSuperAdmin(currentAdminId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verify current user is super admin
            const currentAdmin = yield this.verifyUserRole(currentAdminId, client_1.UserType.SuperAdmin);
            const hashedPassword = yield this.hashPassword(input.password);
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Get or create super admin role
                const superAdminRole = yield tx.role.upsert({
                    where: { roleName: 'SuperAdmin' },
                    update: {},
                    create: {
                        roleName: 'SuperAdmin',
                        roleDescription: 'System super administrator with all permissions',
                        isDefault: false,
                    },
                });
                // Create the user
                const user = yield tx.user.create({
                    data: {
                        phoneNo: input.phoneNo,
                        name: input.name,
                        password: hashedPassword,
                        email: input.email,
                        role: client_1.UserType.SuperAdmin,
                        isVerified: true,
                    },
                });
                // Assign role to user
                yield tx.userRole.create({
                    data: {
                        userId: user.userId,
                        roleId: superAdminRole.roleId,
                    },
                });
                // Assign all permissions to super admin role
                const allPermissions = Object.values(client_1.PermissionType);
                for (const permission of allPermissions) {
                    yield tx.rolePermission.create({
                        data: {
                            roleId: superAdminRole.roleId,
                            permission,
                            actions: [client_1.ActionType.ALL],
                        },
                    });
                }
                // return user without password
                const { password } = user, userWithoutPassword = __rest(user, ["password"]);
                return userWithoutPassword;
            }));
        });
    }
    /**
     * Create a new admin (can be done by super admin)
     */
    createAdmin(currentAdminId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verify current user is super admin
            const currentAdmin = yield this.verifyUserRole(currentAdminId, client_1.UserType.SuperAdmin);
            const hashedPassword = yield this.hashPassword(input.password);
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Get or create admin role
                const adminRole = yield tx.role.upsert({
                    where: { roleName: 'Admin' },
                    update: {},
                    create: {
                        roleName: 'Admin',
                        roleDescription: 'System administrator with limited permissions',
                        isDefault: false,
                    },
                });
                // Create the user
                const user = yield tx.user.create({
                    data: {
                        phoneNo: input.phoneNo,
                        name: input.name,
                        password: hashedPassword,
                        email: input.email,
                        role: client_1.UserType.Admin,
                        isVerified: true,
                    },
                });
                // Assign role to user
                yield tx.userRole.create({
                    data: {
                        userId: user.userId,
                        roleId: adminRole.roleId,
                    },
                });
                // Assign basic admin permissions
                const adminPermissions = [
                    client_1.PermissionType.PRODUCT_MANAGEMENT,
                    client_1.PermissionType.ORDER_MANAGEMENT,
                ];
                for (const permission of adminPermissions) {
                    yield tx.rolePermission.create({
                        data: {
                            roleId: adminRole.roleId,
                            permission,
                            actions: [client_1.ActionType.CREATE, client_1.ActionType.READ, client_1.ActionType.UPDATE],
                        },
                    });
                }
                return user;
            }));
        });
    }
    /**
     * Create a new seller with optional referral code
     */
    createSeller(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedPassword = yield this.hashPassword(input.password);
            const verifiedPhoneNo = yield otp_services_1.default.isVerified(input.phoneNo);
            if (!verifiedPhoneNo.isVerified) {
                throw new ApiError_1.default(400, 'Phone number is not verified');
            }
            // check if the phone number is already registered as a seller
            const existingSeller = yield prisma_1.default.user.findUnique({
                where: { phoneNo: input.phoneNo },
            });
            if (existingSeller) {
                throw new ApiError_1.default(400, 'Phone number is already registered as a seller');
            }
            // check email unique constraint
            if (input.email) {
                const existingEmail = yield prisma_1.default.user.findUnique({
                    where: { email: input.email },
                });
                if (existingEmail) {
                    throw new ApiError_1.default(400, 'Email is already used by another user');
                }
            }
            let referredByPhone = null;
            if (input.referralCode) {
                const referrer = yield prisma_1.default.user.findUnique({
                    where: { referralCode: input.referralCode },
                    select: { phoneNo: true },
                });
                if (!referrer) {
                    throw new ApiError_1.default(400, 'Invalid referral code');
                }
                referredByPhone = referrer.phoneNo;
            }
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Handle referral if provided
                // Get or create seller role
                const sellerRole = yield tx.role.upsert({
                    where: { roleName: 'Seller' },
                    update: {},
                    create: {
                        roleName: 'Seller',
                        roleDescription: 'Regular seller account',
                        isDefault: true,
                    },
                });
                // Create the user
                const userData = Object.assign({ phoneNo: input.phoneNo, name: input.name, password: hashedPassword, email: input.email, role: client_1.UserType.Seller, isVerified: false, zilla: input.zilla, upazilla: input.upazilla, address: input.address, shopName: input.shopName, nomineePhone: input.nomineePhone, facebookProfileLink: input.facebookProfileLink }, (referredByPhone
                    ? {
                        referredBy: {
                            connect: { phoneNo: referredByPhone },
                        },
                    }
                    : {}));
                // Create the user
                const user = yield tx.user.create({
                    data: userData,
                });
                // Assign role to user
                yield tx.userRole.create({
                    data: {
                        userId: user.userId,
                        roleId: sellerRole.roleId,
                    },
                });
                // return user without password
                const { password } = user, userWithoutPassword = __rest(user, ["password"]);
                return userWithoutPassword;
            }));
        });
    }
    /**
     * Create a new customer
     */
    createCustomer(_a) {
        return __awaiter(this, arguments, void 0, function* ({ customerName, customerPhoneNo, sellerCode, }) {
            // check if the customer already exists
            const existingCustomer = yield prisma_1.default.customer.findUnique({
                where: { customerPhoneNo },
            });
            if (existingCustomer) {
                throw new ApiError_1.default(400, 'Customer already exists with this phone number');
            }
            // check if the phone number is a seller already
            const existingSeller = yield prisma_1.default.user.findUnique({
                where: { phoneNo: customerPhoneNo },
            });
            if (existingSeller) {
                throw new ApiError_1.default(400, 'Phone number is already registered as a seller');
            }
            // check seller exists with the given sellerCode
            const seller = yield prisma_1.default.user.findUnique({
                where: { referralCode: sellerCode },
            });
            if (!seller) {
                throw new ApiError_1.default(404, 'Seller not found with the provided code');
            }
            // check if the customer phone number is verified
            const verifiedPhoneNo = yield otp_services_1.default.isVerified(customerPhoneNo);
            if (!verifiedPhoneNo.isVerified) {
                throw new ApiError_1.default(400, 'Customer phone number is not verified');
            }
            return yield prisma_1.default.customer.create({
                data: {
                    customerName,
                    customerPhoneNo,
                    sellerCode,
                    role: 'Customer',
                    sellerId: seller.userId,
                    sellerName: seller.name,
                    sellerPhone: seller.phoneNo,
                },
            });
        });
    }
    /**
     * Make Super Admin a normal admin
     */
    demoteSuperAdminToAdmin(currentAdminId, superAdminId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verify current user is super admin
            yield this.verifyUserRole(currentAdminId, client_1.UserType.SuperAdmin);
            // Check if the super admin exists
            const superAdmin = yield prisma_1.default.user.findUnique({
                where: { userId: superAdminId, role: client_1.UserType.SuperAdmin },
                include: { userRoles: true },
            });
            if (!superAdmin) {
                throw new ApiError_1.default(404, 'Super Admin not found');
            }
            if (superAdmin.userId === currentAdminId) {
                throw new ApiError_1.default(400, 'You cannot demote yourself');
            }
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Get admin role
                const adminRole = yield tx.role.findUnique({
                    where: { roleName: 'Admin' },
                });
                if (!adminRole) {
                    throw new ApiError_1.default(404, 'Admin role not found');
                }
                // Remove all existing role assignments
                yield tx.userRole.deleteMany({
                    where: { userId: superAdminId },
                });
                // Assign admin role
                yield tx.userRole.create({
                    data: {
                        userId: superAdminId,
                        roleId: adminRole.roleId,
                    },
                });
                // Update the user role to Admin
                const updatedUser = yield tx.user.update({
                    where: { userId: superAdminId },
                    data: { role: client_1.UserType.Admin },
                });
                return updatedUser;
            }));
        });
    }
    promoteAdminToSuperAdmin(currentAdminId, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verify current user is super admin
            yield this.verifyUserRole(currentAdminId, client_1.UserType.SuperAdmin);
            // Check if the admin exists
            const admin = yield prisma_1.default.user.findUnique({
                where: { userId: adminId, role: client_1.UserType.Admin },
                include: { userRoles: true },
            });
            if (!admin) {
                throw new ApiError_1.default(404, 'Admin not found');
            }
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Get super admin role
                const superAdminRole = yield tx.role.findUnique({
                    where: { roleName: 'SuperAdmin' },
                });
                if (!superAdminRole) {
                    throw new ApiError_1.default(404, 'Super Admin role not found');
                }
                // Remove all existing role assignments
                yield tx.userRole.deleteMany({
                    where: { userId: adminId },
                });
                // Assign super admin role
                yield tx.userRole.create({
                    data: {
                        userId: adminId,
                        roleId: superAdminRole.roleId,
                    },
                });
                // Update the user role to Super Admin
                const updatedUser = yield tx.user.update({
                    where: { userId: adminId },
                    data: { role: client_1.UserType.SuperAdmin },
                });
                return updatedUser;
            }));
        });
    }
    // ==========================================
    // AUTHENTICATION METHODS
    // ==========================================
    /**
     * Login with phone and password
     */
    login(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.default.user.findUnique({
                where: { phoneNo: input.phoneNo },
                include: {
                    userRoles: {
                        include: {
                            role: {
                                include: {
                                    permissions: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            const isPasswordValid = yield this.comparePassword({
                password: input.password,
                hash: user.password,
            });
            if (!isPasswordValid) {
                throw new ApiError_1.default(401, 'Invalid credentials');
            }
            // Check if user is blocked
            // const block = await prisma.block.findFirst({
            //   where: {
            //     userPhoneNo: user.phoneNo,
            //     isActive: true,
            //     actionTypes: {
            //       has: BlockActionType.,
            //     },
            //     expiresAt: { gt: new Date() },
            //   },
            // })
            // if (block) {
            //   throw new ApiError(403, 'Your account is currently blocked')
            // }
            console.log('user login.....', user);
            const token = this.generateAccessToken(user.userId, user.role, user.phoneNo);
            const { password } = user, userWithoutPassword = __rest(user, ["password"]);
            return {
                user: userWithoutPassword,
                token,
            };
        });
    }
    /**
     * Reset password (forgot password flow)
     */
    resetPassword(phoneNo) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.default.user.findUnique({
                where: { phoneNo },
            });
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            if (user.totalPasswordResetRequests >= config_1.default.maxForgotPasswordAttempts) {
                throw new ApiError_1.default(403, 'Maximum password reset requests exceeded');
            }
            // if passwordSendsAt is within the last 5 minutes, throw an error
            if (user.passwordSendsAt) {
                const timeElapsed = Date.now() - user.passwordSendsAt.getTime();
                if (timeElapsed < config_1.default.forgotPasswordRequestInterval) {
                    throw new ApiError_1.default(403, `A password is already sent to this number.`);
                }
            }
            const newPassword = this.generateRandomPassword();
            const hashedPassword = yield this.hashPassword(newPassword);
            // await smsServices.sendSms({ phoneNo: user.phoneNo, message: `Your new password is: ${newPassword}` })
            const updatedUser = yield prisma_1.default.user.update({
                where: { phoneNo },
                data: {
                    password: hashedPassword,
                    passwordSendsAt: new Date(),
                    totalPasswordResetRequests: { increment: 1 },
                },
            });
            const { password } = updatedUser, userWithoutPassword = __rest(updatedUser, ["password"]);
            return userWithoutPassword;
        });
    }
    // ==========================================
    // PROFILE MANAGEMENT
    // ==========================================
    /**
     * Get user profile
     */
    getProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.default.user.findUnique({
                where: { userId },
                include: {
                    userRoles: {
                        include: {
                            role: true,
                        },
                    },
                    referredBy: true,
                },
            });
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            // Exclude password from the returned user object
            const { password } = user, userWithoutPassword = __rest(user, ["password"]);
            return userWithoutPassword;
        });
    }
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.default.user.findUnique({
                where: { userId },
                include: {
                    userRoles: {
                        include: {
                            role: true,
                        },
                    },
                    referredBy: true,
                    Wallet: true,
                },
            });
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            // Exclude password from the returned user object
            const { password } = user, userWithoutPassword = __rest(user, ["password"]);
            return userWithoutPassword;
        });
    }
    getUserByPhoneNo(phoneNo) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.default.user.findUnique({
                where: { phoneNo },
                include: {
                    userRoles: {
                        include: {
                            role: true,
                        },
                    },
                    referredBy: true,
                    Wallet: true,
                },
            });
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            // Exclude password from the returned user object
            const { password } = user, userWithoutPassword = __rest(user, ["password"]);
            return userWithoutPassword;
        });
    }
    /**
     * Update user profile
     */
    updateProfile(userId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            const _a = yield prisma_1.default.user.update({
                where: { userId },
                data: input,
            }), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
            return userWithoutPassword;
        });
    }
    /**
     * Change password
     */
    changePassword(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.default.user.findUnique({
                where: { userId: input.userId },
            });
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            const isPasswordValid = yield this.comparePassword({
                password: input.currentPassword,
                hash: user.password,
            });
            if (!isPasswordValid) {
                throw new ApiError_1.default(401, 'Current password is incorrect');
            }
            const hashedPassword = yield this.hashPassword(input.newPassword);
            return yield prisma_1.default.user.update({
                where: { userId: input.userId },
                data: { password: hashedPassword },
            });
        });
    }
    /**
     * Add Referral code to seller
     */
    addReferralCodeToSeller(sellerId, referralCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const seller = yield prisma_1.default.user.findUnique({
                where: { userId: sellerId, role: client_1.UserType.Seller },
            });
            if (!seller) {
                throw new ApiError_1.default(404, 'Seller not found');
            }
            // Check if referral code already exists
            const existingReferral = yield prisma_1.default.user.findUnique({
                where: { referralCode },
            });
            if (existingReferral) {
                throw new ApiError_1.default(400, 'রেফারেল কোড ইতোমধ্যে ব্যবহৃত, অনুগ্রহ করে অন্য একটি বেছে নিন');
            }
            return yield prisma_1.default.user.update({
                where: { userId: sellerId, role: client_1.UserType.Seller },
                data: { referralCode },
            });
        });
    }
    // ==========================================
    // ROLE & PERMISSION MANAGEMENT
    // ==========================================
    /**
     * Create a new role
     */
    createRole(creatorId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyUserPermission(creatorId, client_1.PermissionType.USER_MANAGEMENT, client_1.ActionType.CREATE);
            return yield prisma_1.default.role.create({
                data: {
                    roleName: input.roleName,
                    roleDescription: input.description,
                    isDefault: input.isDefault || false,
                },
            });
        });
    }
    /**
     * Assign permission to role
     */
    assignPermissionToRole(adminId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyUserPermission(adminId, client_1.PermissionType.USER_MANAGEMENT, client_1.ActionType.UPDATE);
            return yield prisma_1.default.rolePermission.upsert({
                where: {
                    roleId_permission: {
                        roleId: input.roleId,
                        permission: input.permission,
                    },
                },
                update: {
                    actions: input.actions,
                },
                create: {
                    roleId: input.roleId,
                    permission: input.permission,
                    actions: input.actions,
                },
            });
        });
    }
    /**
     * Assign role to user
     */
    assignRoleToUser(adminId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyUserPermission(adminId, client_1.PermissionType.USER_MANAGEMENT, client_1.ActionType.UPDATE);
            return yield prisma_1.default.userRole.create({
                data: {
                    userId: input.userId,
                    roleId: input.roleId,
                },
            });
        });
    }
    // ==========================================
    // BLOCK MANAGEMENT
    // ==========================================
    /**
     * Block a user
     */
    blockUser(adminId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyUserPermission(adminId, client_1.PermissionType.USER_MANAGEMENT, client_1.ActionType.BLOCK);
            const user = yield prisma_1.default.user.findUnique({
                where: { phoneNo: input.userPhoneNo },
            });
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            return yield prisma_1.default.block.create({
                data: {
                    userPhoneNo: input.userPhoneNo,
                    userName: user.name,
                    reason: input.reason,
                    actionTypes: input.actionTypes,
                    expiresAt: input.expiresAt,
                    isActive: true,
                },
            });
        });
    }
    /**
     * Unblock a user
     */
    unblockUser(adminId, blockId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyUserPermission(adminId, client_1.PermissionType.USER_MANAGEMENT, client_1.ActionType.BLOCK);
            return yield prisma_1.default.block.update({
                where: { blockId },
                data: { isActive: false },
            });
        });
    }
    // ==========================================
    // HELPER METHODS
    // ==========================================
    /**
     * Verify user has specific role
     */
    verifyUserRole(userId, requiredRole) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.default.user.findUnique({
                where: { userId },
                include: { userRoles: true },
            });
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            if (user.role !== requiredRole) {
                throw new ApiError_1.default(403, 'Insufficient privileges');
            }
            return user;
        });
    }
    /**
     * Verify user has specific permission
     */
    verifyUserPermission(userId, permission, action) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.default.user.findUnique({
                where: { userId },
                include: {
                    userRoles: {
                        include: {
                            role: {
                                include: {
                                    permissions: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            // Super admin has all permissions
            if (user.role === client_1.UserType.SuperAdmin) {
                return user;
            }
            // Check permissions for other users
            for (const userRole of user.userRoles) {
                for (const rolePermission of userRole.role.permissions) {
                    if (rolePermission.permission === permission ||
                        rolePermission.permission === client_1.PermissionType.ALL) {
                        if (rolePermission.actions.includes(action) ||
                            rolePermission.actions.includes(client_1.ActionType.ALL)) {
                            return user;
                        }
                    }
                }
            }
            throw new ApiError_1.default(403, 'Insufficient permissions');
        });
    }
    //add another helper method to test if a user is blocked for some action
    isUserBlocked(userPhoneNo, actionType) {
        return __awaiter(this, void 0, void 0, function* () {
            const block = yield prisma_1.default.block.findFirst({
                where: {
                    userPhoneNo,
                    isActive: true,
                    AND: [
                        {
                            OR: [
                                { actionTypes: { has: actionType } },
                                { actionTypes: { has: client_1.BlockActionType.ALL } }, // Check for ALL action type
                            ],
                        },
                        {
                            OR: [
                                { expiresAt: { gt: new Date() } },
                                { expiresAt: null }, // Handle never-expiring blocks
                            ],
                        },
                    ],
                },
            });
            return !!block;
        });
    }
}
exports.default = new UserManagementServices();
