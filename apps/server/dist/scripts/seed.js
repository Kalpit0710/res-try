"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const Class_1 = require("../models/Class");
const Subject_1 = require("../models/Subject");
const Teacher_1 = require("../models/Teacher");
const Student_1 = require("../models/Student");
const Marks_1 = require("../models/Marks");
const Log_1 = require("../models/Log");
const Lock_1 = require("../models/Lock");
const mongoUri_1 = require("../config/mongoUri");
const classSeeds = [
    {
        name: '8-A',
        subjects: [
            'English',
            'Mathematics',
            'Science',
            'Social Studies',
        ].map((name) => ({
            name,
            maxMarks: {
                term1: { periodicTest: 10, notebook: 5, subEnrichment: 5, halfYearlyExam: 30 },
                term2: { periodicTest: 10, notebook: 5, subEnrichment: 5, yearlyExam: 30 },
            },
        })),
    },
    {
        name: '9-A',
        subjects: [
            'English',
            'Mathematics',
            'Science',
            'Computer Applications',
        ].map((name) => ({
            name,
            maxMarks: {
                term1: { periodicTest: 10, notebook: 5, subEnrichment: 5, halfYearlyExam: 30 },
                term2: { periodicTest: 10, notebook: 5, subEnrichment: 5, yearlyExam: 30 },
            },
        })),
    },
    {
        name: '10-A',
        subjects: [
            'English',
            'Mathematics',
            'Science',
            'Social Science',
            'Computer Applications',
            'Artificial Intelligence',
        ].map((name) => ({
            name,
            maxMarks: {
                term1: { periodicTest: 10, notebook: 5, subEnrichment: 5, halfYearlyExam: 30 },
                term2: { periodicTest: 10, notebook: 5, subEnrichment: 5, yearlyExam: 30 },
            },
        })),
    },
    {
        name: '11-Science',
        subjects: [
            'Physics',
            'Chemistry',
            'Mathematics',
            'Computer Science',
        ].map((name) => ({
            name,
            maxMarks: {
                term1: { periodicTest: 10, notebook: 5, subEnrichment: 5, halfYearlyExam: 30 },
                term2: { periodicTest: 10, notebook: 5, subEnrichment: 5, yearlyExam: 30 },
            },
        })),
    },
];
const teacherSeeds = ['Asha Verma', 'Rahul Kumar', 'Neha Sharma', 'Imran Khan'];
const studentSeeds = [
    { regNo: '2025-8A-001', name: 'Arjun Kumar', fatherName: 'Sanjay Kumar', motherName: 'Pooja Kumar', dob: '2012-04-12', rollNo: '1', className: '8-A' },
    { regNo: '2025-8A-002', name: 'Ananya Singh', fatherName: 'Vivek Singh', motherName: 'Rita Singh', dob: '2012-09-24', rollNo: '2', className: '8-A' },
    { regNo: '2025-9A-001', name: 'Riya Patel', fatherName: 'Mahesh Patel', motherName: 'Kiran Patel', dob: '2011-01-18', rollNo: '1', className: '9-A' },
    { regNo: '2025-9A-002', name: 'Kabir Das', fatherName: 'Anil Das', motherName: 'Sangeeta Das', dob: '2011-08-07', rollNo: '2', className: '9-A' },
    { regNo: '2025-10A-001', name: 'Meera Iyer', fatherName: 'N. Iyer', motherName: 'Lakshmi Iyer', dob: '2010-03-03', rollNo: '1', className: '10-A' },
    { regNo: '2025-10A-002', name: 'Aarav Verma', fatherName: 'Rohit Verma', motherName: 'Sonia Verma', dob: '2010-11-15', rollNo: '2', className: '10-A' },
];
const markSeeds = [
    {
        regNo: '2025-10A-001',
        subjectName: 'English',
        teacherName: 'Asha Verma',
        term1: { periodicTest: 8, notebook: 4, subEnrichment: 5, halfYearlyExam: 25 },
        term2: { periodicTest: 9, notebook: 5, subEnrichment: 5, yearlyExam: 26 },
    },
    {
        regNo: '2025-10A-001',
        subjectName: 'Mathematics',
        teacherName: 'Rahul Kumar',
        term1: { periodicTest: 9, notebook: 5, subEnrichment: 5, halfYearlyExam: 27 },
        term2: { periodicTest: 8, notebook: 5, subEnrichment: 4, yearlyExam: 28 },
    },
    {
        regNo: '2025-10A-001',
        subjectName: 'Science',
        teacherName: 'Neha Sharma',
        term1: { periodicTest: 7, notebook: 4, subEnrichment: 5, halfYearlyExam: 24 },
        term2: { periodicTest: 8, notebook: 4, subEnrichment: 5, yearlyExam: 25 },
    },
    {
        regNo: '2025-10A-001',
        subjectName: 'Social Science',
        teacherName: 'Imran Khan',
        term1: { periodicTest: 9, notebook: 5, subEnrichment: 4, halfYearlyExam: 26 },
        term2: { periodicTest: 9, notebook: 5, subEnrichment: 5, yearlyExam: 27 },
    },
    {
        regNo: '2025-10A-001',
        subjectName: 'Computer Applications',
        teacherName: 'Asha Verma',
        term1: { periodicTest: 10, notebook: 5, subEnrichment: 5, halfYearlyExam: 28 },
        term2: { periodicTest: 10, notebook: 5, subEnrichment: 5, yearlyExam: 29 },
    },
    {
        regNo: '2025-10A-001',
        subjectName: 'Artificial Intelligence',
        teacherName: 'Rahul Kumar',
        term1: { periodicTest: 10, notebook: 5, subEnrichment: 5, halfYearlyExam: 30 },
        term2: { periodicTest: 10, notebook: 5, subEnrichment: 5, yearlyExam: 30 },
    },
];
async function main() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGO_URI is required to seed the database');
    }
    await mongoose_1.default.connect((0, mongoUri_1.normalizeMongoUri)(uri));
    console.log('Connected to MongoDB for seeding');
    await Promise.all([
        Log_1.Log.deleteMany({}),
        Marks_1.Marks.deleteMany({}),
        Student_1.Student.deleteMany({}),
        Subject_1.Subject.deleteMany({}),
        Class_1.Class.deleteMany({}),
        Teacher_1.Teacher.deleteMany({}),
        Lock_1.Lock.deleteMany({}),
    ]);
    const teacherDocs = await Teacher_1.Teacher.insertMany(teacherSeeds.map((name) => ({ name })));
    const teacherByName = new Map(teacherDocs.map((doc) => [doc.name, doc]));
    const classDocs = [];
    const classByName = new Map();
    const subjectByClassAndName = new Map();
    for (const classSeed of classSeeds) {
        const classDoc = await Class_1.Class.create({ name: classSeed.name, subjects: [] });
        classDocs.push(classDoc);
        classByName.set(classSeed.name, classDoc);
        const subjectDocs = await Subject_1.Subject.insertMany(classSeed.subjects.map((subject) => ({
            name: subject.name,
            classId: classDoc._id,
            maxMarks: subject.maxMarks,
        })));
        for (const subjectDoc of subjectDocs) {
            subjectByClassAndName.set(`${classSeed.name}:${subjectDoc.name}`, subjectDoc);
        }
        classDoc.subjects = subjectDocs.map((subjectDoc) => subjectDoc._id);
        await classDoc.save();
    }
    const studentDocs = await Student_1.Student.insertMany(studentSeeds.map((student) => ({
        regNo: student.regNo,
        name: student.name,
        fatherName: student.fatherName,
        motherName: student.motherName,
        dob: student.dob,
        classId: classByName.get(student.className)._id,
        rollNo: student.rollNo,
    })));
    const studentByRegNo = new Map(studentDocs.map((doc) => [doc.regNo, doc]));
    const marksPayload = markSeeds.map((mark) => {
        const studentDoc = studentByRegNo.get(mark.regNo);
        const className = studentDoc
            ? classDocs.find((classDoc) => classDoc._id.equals(studentDoc.classId))?.name
            : undefined;
        const subjectDoc = className ? subjectByClassAndName.get(`${className}:${mark.subjectName}`) : undefined;
        const teacherDoc = teacherByName.get(mark.teacherName);
        if (!studentDoc || !subjectDoc || !teacherDoc) {
            throw new Error(`Unable to resolve seed references for ${mark.regNo} / ${mark.subjectName}`);
        }
        return {
            studentId: studentDoc._id,
            subjectId: subjectDoc._id,
            teacherName: teacherDoc.name,
            term1: mark.term1,
            term2: mark.term2,
        };
    });
    const marksDocs = await Marks_1.Marks.insertMany(marksPayload);
    const englishSubjectId = subjectByClassAndName.get('10-A:English')?._id;
    const mathSubjectId = subjectByClassAndName.get('10-A:Mathematics')?._id;
    const targetStudentId = studentByRegNo.get('2025-10A-001')?._id;
    const futureClassId = classByName.get('11-Science')._id.toString();
    if (!targetStudentId || !englishSubjectId || !mathSubjectId || !futureClassId) {
        throw new Error('Seed data references could not be resolved');
    }
    await Log_1.Log.insertMany([
        {
            teacherName: 'Asha Verma',
            action: 'seeded_demo_data',
            studentId: targetStudentId,
            subjectId: englishSubjectId,
            timestamp: new Date('2026-04-15T10:00:00.000Z'),
        },
        {
            teacherName: 'Rahul Kumar',
            action: 'marks_saved',
            studentId: targetStudentId,
            subjectId: mathSubjectId,
            timestamp: new Date('2026-04-16T11:30:00.000Z'),
        },
        {
            teacherName: 'Admin',
            action: 'future_class_provisioned',
            timestamp: new Date('2026-04-20T08:00:00.000Z'),
        },
    ]);
    await Lock_1.Lock.insertMany([
        { type: 'system', referenceId: 'global', isLocked: false },
        { type: 'class', referenceId: classByName.get('10-A')._id.toString(), isLocked: false },
        { type: 'class', referenceId: futureClassId, isLocked: false },
        { type: 'student', referenceId: targetStudentId.toString(), isLocked: false },
        { type: 'teacher', referenceId: 'Asha Verma', isLocked: false },
    ]);
    console.log('\nSeed completed successfully');
    console.log(`Teachers: ${teacherDocs.length}`);
    console.log(`Classes: ${classDocs.length}`);
    console.log(`Students: ${studentDocs.length}`);
    console.log(`Marks: ${marksDocs.length}`);
    console.log('Logs: 3');
    console.log('Locks: 5');
    console.log('Future perspective included: 11-Science class + Artificial Intelligence subject');
}
main()
    .catch((err) => {
    console.error('Seed failed');
    console.error(err);
    process.exitCode = 1;
})
    .finally(async () => {
    await mongoose_1.default.disconnect();
    console.log('Disconnected from MongoDB');
});
