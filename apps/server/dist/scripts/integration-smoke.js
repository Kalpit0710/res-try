"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const API_BASE_URL = (process.env.SMOKE_API_BASE_URL ?? 'http://localhost:5000/api/v1').replace(/\/$/, '');
const ADMIN_USERNAME = process.env.SMOKE_ADMIN_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? 'Admin@1234';
async function jsonRequest(path, init) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    return { status: response.status, body };
}
async function expectStatus(path, expectedStatus, init) {
    const { status, body } = await jsonRequest(path, init);
    strict_1.default.equal(status, expectedStatus, `Expected ${path} to return ${expectedStatus}, got ${status}`);
    return body;
}
function uniqueLabel(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}
async function main() {
    console.log(`[smoke] API base: ${API_BASE_URL}`);
    const health = await fetch(`${API_BASE_URL.replace(/\/api\/v1$/, '')}/health`).catch(() => null);
    strict_1.default.ok(health, 'Health endpoint is unreachable');
    const login = await expectStatus('/auth/login', 200, {
        method: 'POST',
        body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
    });
    strict_1.default.equal(login.success, true, 'Login should succeed');
    strict_1.default.ok(login.data.token, 'Login should return a token');
    const token = login.data.token;
    await expectStatus('/students', 401);
    await expectStatus('/students', 200, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const className = uniqueLabel('SmokeClass');
    const teacherName = uniqueLabel('SmokeTeacher');
    const regNo = uniqueLabel('REG');
    const subjectName = uniqueLabel('SmokeSubject');
    const createdClass = await expectStatus('/classes', 201, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: className }),
    });
    const classId = createdClass.data._id;
    const createdTeacher = await expectStatus('/teachers', 201, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: teacherName }),
    });
    const createdStudent = await expectStatus('/students', 201, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ regNo, name: uniqueLabel('SmokeStudent'), classId }),
    });
    const studentId = createdStudent.data._id;
    await expectStatus('/students', 409, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ regNo, name: uniqueLabel('DuplicateStudent'), classId }),
    });
    const createdSubject = await expectStatus('/subjects', 201, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: subjectName, classId }),
    });
    const subjectId = createdSubject.data._id;
    const teacherLookup = await expectStatus(`/marks/teachers`, 200);
    strict_1.default.equal(teacherLookup.data.some((teacher) => teacher.name === teacherName), true, 'Public teacher lookup should include the created teacher');
    const studentLookup = await expectStatus(`/marks/students?search=${encodeURIComponent(regNo)}`, 200);
    strict_1.default.equal(studentLookup.data.some((student) => student.regNo === regNo), true, 'Public student lookup should include the created student');
    const subjectLookup = await expectStatus(`/marks/subjects?classId=${classId}`, 200);
    strict_1.default.equal(subjectLookup.data.some((subject) => subject.name === subjectName), true, 'Public subject lookup should include the created subject');
    const savedMarks = await expectStatus('/marks', 201, {
        method: 'POST',
        body: JSON.stringify({
            studentId,
            subjectId,
            teacherName,
            term1: { periodicTest: 8, notebook: 4, subEnrichment: 5, halfYearlyExam: 26 },
            term2: { periodicTest: 7, notebook: 4, subEnrichment: 5, yearlyExam: 24 },
        }),
    });
    const marksId = savedMarks.data._id;
    const marksList = await expectStatus(`/marks?studentId=${studentId}&subjectId=${subjectId}`, 200);
    strict_1.default.equal(marksList.data.length > 0, true, 'Marks lookup should return the saved record');
    const createdLock = await expectStatus('/locks', 201, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'class', referenceId: classId, isLocked: true }),
    });
    await expectStatus(`/marks/${marksId}`, 403, {
        method: 'PUT',
        body: JSON.stringify({
            teacherName,
            term1: { periodicTest: 9 },
            term2: { yearlyExam: 25 },
        }),
    });
    await expectStatus(`/locks/${createdLock.data._id}`, 200, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    const updatedMarks = await expectStatus(`/marks/${marksId}`, 200, {
        method: 'PUT',
        body: JSON.stringify({
            teacherName,
            term1: { periodicTest: 9 },
            term2: { yearlyExam: 25 },
        }),
    });
    strict_1.default.equal(updatedMarks.data.term1.periodicTest, 9, 'Marks update should persist changes');
    await expectStatus(`/teachers/${createdTeacher.data._id}`, 200, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    await expectStatus(`/subjects/${subjectId}`, 200, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    await expectStatus(`/students/${studentId}`, 200, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    await expectStatus(`/classes/${classId}`, 200, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log('[smoke] passed');
}
main().catch((error) => {
    console.error('[smoke] failed');
    console.error(error);
    process.exitCode = 1;
});
