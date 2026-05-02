"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudents = getStudents;
exports.getStudentById = getStudentById;
exports.createStudent = createStudent;
exports.updateStudent = updateStudent;
exports.deleteStudent = deleteStudent;
exports.bulkUploadStudents = bulkUploadStudents;
exports.parseBulkStudents = parseBulkStudents;
exports.commitBulkStudents = commitBulkStudents;
const XLSX = __importStar(require("xlsx"));
const Student_1 = require("../models/Student");
const Class_1 = require("../models/Class");
// GET /students?search=&classId=&page=&limit=
async function getStudents(req, res) {
    const { search, classId, page = '1', limit = '20' } = req.query;
    const query = {};
    if (classId)
        query.classId = classId;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { regNo: { $regex: search, $options: 'i' } },
        ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
        Student_1.Student.find(query).populate('classId', 'name').skip(skip).limit(parseInt(limit)).lean(),
        Student_1.Student.countDocuments(query),
    ]);
    res.json({ success: true, data, total, page: parseInt(page), limit: parseInt(limit) });
}
async function getStudentById(req, res) {
    const student = await Student_1.Student.findById(req.params.id).populate('classId', 'name').lean();
    if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
    }
    res.json({ success: true, data: student });
}
async function createStudent(req, res) {
    const { regNo, name, fatherName, motherName, dob, classId, rollNo } = req.body;
    if (!regNo || !name || !classId) {
        res.status(400).json({ success: false, message: 'regNo, name, and classId are required' });
        return;
    }
    const existing = await Student_1.Student.findOne({ regNo });
    if (existing) {
        res.status(409).json({ success: false, message: `regNo "${regNo}" already exists` });
        return;
    }
    const student = await Student_1.Student.create({ regNo, name, fatherName, motherName, dob, classId, rollNo });
    res.status(201).json({ success: true, data: student });
}
async function updateStudent(req, res) {
    const { regNo, name, fatherName, motherName, dob, classId, rollNo } = req.body;
    const student = await Student_1.Student.findByIdAndUpdate(req.params.id, { regNo, name, fatherName, motherName, dob, classId, rollNo }, { new: true, runValidators: true });
    if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
    }
    res.json({ success: true, data: student });
}
async function deleteStudent(req, res) {
    const student = await Student_1.Student.findByIdAndDelete(req.params.id);
    if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
    }
    res.json({ success: true, message: 'Student deleted' });
}
// POST /students/bulk-upload (multipart/form-data, field: "file")
async function bulkUploadStudents(req, res) {
    if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
    }
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    // Resolve class names to IDs
    const classNames = [...new Set(rows.map(r => r.class?.trim()).filter(Boolean))];
    const classes = await Class_1.Class.find({ name: { $in: classNames } }).lean();
    const classMap = Object.fromEntries(classes.map(c => [c.name, c._id.toString()]));
    const succeeded = [];
    const failed = [];
    const seenInFile = new Set();
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const regNo = row.regNo?.trim();
        const name = row.name?.trim();
        const className = row.class?.trim();
        if (!regNo || !name || !className) {
            failed.push({ row: i + 2, regNo: regNo ?? '', reason: 'Missing required field (regNo, name, class)' });
            continue;
        }
        if (seenInFile.has(regNo)) {
            failed.push({ row: i + 2, regNo, reason: 'Duplicate regNo within file' });
            continue;
        }
        seenInFile.add(regNo);
        const classId = classMap[className];
        if (!classId) {
            failed.push({ row: i + 2, regNo, reason: `Class "${className}" not found in system` });
            continue;
        }
        try {
            await Student_1.Student.create({
                regNo,
                name,
                fatherName: row.fatherName?.trim(),
                motherName: row.motherName?.trim(),
                dob: row.dob ? new Date(row.dob) : undefined,
                classId,
                rollNo: row.rollNo?.trim(),
            });
            succeeded.push(regNo);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            failed.push({ row: i + 2, regNo, reason: msg.includes('duplicate') ? 'regNo already exists in system' : msg });
        }
    }
    res.json({
        success: true,
        data: { total: rows.length, succeeded: succeeded.length, failed: failed.length },
        errors: failed,
    });
}
// POST /students/bulk-parse (multipart/form-data, field: "file")
async function parseBulkStudents(req, res) {
    if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
    }
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    // Resolve class names to IDs
    const classNames = [...new Set(rows.map(r => r.class?.trim()).filter(Boolean))];
    const classes = await Class_1.Class.find({ name: { $in: classNames } }).lean();
    const classMap = Object.fromEntries(classes.map(c => [c.name, c._id.toString()]));
    const errors = [];
    const parsed = [];
    const seenInFile = new Set();
    // Also load existing regNos to flag duplicates in system
    const existingRegs = await Student_1.Student.find({ regNo: { $in: rows.map(r => r.regNo?.trim()).filter(Boolean) } }).lean();
    const existingSet = new Set(existingRegs.map(e => e.regNo));
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const regNo = row.regNo?.trim();
        const name = row.name?.trim();
        const className = row.class?.trim();
        const resultRow = {
            __row: i + 2,
            regNo: regNo ?? '',
            name: name ?? '',
            fatherName: row.fatherName?.trim() ?? '',
            motherName: row.motherName?.trim() ?? '',
            dob: row.dob ?? '',
            class: className ?? '',
            rollNo: row.rollNo?.trim() ?? '',
        };
        // Basic validation
        if (!regNo || !name || !className) {
            errors.push({ row: i + 2, regNo: regNo ?? '', reason: 'Missing required field (regNo, name, class)' });
            resultRow.__valid = false;
            parsed.push(resultRow);
            continue;
        }
        if (seenInFile.has(regNo)) {
            errors.push({ row: i + 2, regNo, reason: 'Duplicate regNo within file' });
            resultRow.__valid = false;
            parsed.push(resultRow);
            continue;
        }
        seenInFile.add(regNo);
        const classId = classMap[className];
        if (!classId) {
            errors.push({ row: i + 2, regNo, reason: `Class "${className}" not found in system` });
            resultRow.__valid = false;
            parsed.push(resultRow);
            continue;
        }
        if (existingSet.has(regNo)) {
            errors.push({ row: i + 2, regNo, reason: 'regNo already exists in system' });
            resultRow.__valid = false;
            parsed.push(resultRow);
            continue;
        }
        resultRow.__valid = true;
        resultRow.classId = classId;
        parsed.push(resultRow);
    }
    res.json({ success: true, data: { total: rows.length, parsed, errors } });
}
// POST /students/bulk-commit (json body: { rows: [...] })
async function commitBulkStudents(req, res) {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.rows)) {
        res.status(400).json({ success: false, message: 'rows array required' });
        return;
    }
    const rows = payload.rows;
    const succeeded = [];
    const failed = [];
    // Resolve classIds if passed as class name
    const classNames = [...new Set(rows.map(r => r.class?.trim()).filter(Boolean))];
    const classes = await Class_1.Class.find({ name: { $in: classNames } }).lean();
    const classMap = Object.fromEntries(classes.map(c => [c.name, c._id.toString()]));
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const regNo = (r.regNo ?? '').trim();
        const name = (r.name ?? '').trim();
        const className = (r.class ?? '').trim();
        if (!regNo || !name || !className) {
            failed.push({ index: i, regNo, reason: 'Missing required field' });
            continue;
        }
        const classId = r.classId ?? classMap[className];
        if (!classId) {
            failed.push({ index: i, regNo, reason: `Class "${className}" not found` });
            continue;
        }
        try {
            await Student_1.Student.create({
                regNo,
                name,
                fatherName: r.fatherName?.trim(),
                motherName: r.motherName?.trim(),
                dob: r.dob ? new Date(r.dob) : undefined,
                classId,
                rollNo: r.rollNo?.trim(),
            });
            succeeded.push(regNo);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            failed.push({ index: i, regNo, reason: msg.includes('duplicate') ? 'regNo already exists' : msg });
        }
    }
    res.json({ success: true, data: { total: rows.length, succeeded: succeeded.length, failed: failed.length }, errors: failed });
}
