"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const log_controller_1 = require("../controllers/log.controller");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, log_controller_1.getLogs);
exports.default = router;
