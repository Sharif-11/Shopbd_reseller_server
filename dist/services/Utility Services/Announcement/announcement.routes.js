"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = require("../../../middlewares/auth.middlewares");
const announcement_controller_1 = __importDefault(require("./announcement.controller"));
const announcementRoutes = (0, express_1.Router)();
announcementRoutes.get('/', announcement_controller_1.default.getAnnouncements);
announcementRoutes.put('/', auth_middlewares_1.isAuthenticated, announcement_controller_1.default.updateAnnouncements);
exports.default = announcementRoutes;
