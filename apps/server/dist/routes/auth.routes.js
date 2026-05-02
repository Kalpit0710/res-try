"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.post('/login', rateLimiter_1.strictLimiter, auth_controller_1.login);
router.post('/logout', auth_controller_1.logout);
exports.default = router;
