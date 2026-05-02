"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const report_controller_1 = require("../controllers/report.controller");
const router = (0, express_1.Router)();
// Admin use-case (teacher flow can be added later if needed)
router.get('/student/:studentId', auth_1.authenticate, report_controller_1.getStudentReport);
// Bulk ZIP download: POST /reports/bulk  { studentIds: string[] }
router.post('/bulk', auth_1.authenticate, report_controller_1.bulkStudentReport);
exports.default = router;
