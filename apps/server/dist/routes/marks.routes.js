"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const marks_controller_1 = require("../controllers/marks.controller");
const router = (0, express_1.Router)();
// Teacher flow is intentionally unauthenticated per PRD
router.get('/', marks_controller_1.getMarks);
router.post('/', marks_controller_1.createMarks);
router.put('/:id', marks_controller_1.updateMarks);
exports.default = router;
