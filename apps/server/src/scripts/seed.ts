import 'dotenv/config';
import mongoose from 'mongoose';
import { Class } from '../models/Class';
import { Subject } from '../models/Subject';
import { Teacher } from '../models/Teacher';
import { Student } from '../models/Student';
import { Marks } from '../models/Marks';
import { Log } from '../models/Log';
import { Lock } from '../models/Lock';
import { normalizeMongoUri } from '../config/mongoUri';

type SubjectSeed = {
  name: string;
  maxMarks: {
    term1: { periodicTest: number; notebook: number; subEnrichment: number; halfYearlyExam: number };
    term2: { periodicTest: number; notebook: number; subEnrichment: number; yearlyExam: number };
  };
};

type ClassSeed = {
  name: string;
  subjects: SubjectSeed[];
};

type StudentSeed = {
  regNo: string;
  name: string;
  fatherName: string;
  motherName: string;
  dob: string;
  rollNo: string;
  className: string;
};

type MarkSeed = {
  regNo: string;
  subjectName: string;
  teacherName: string;
  term1: { periodicTest: number; notebook: number; subEnrichment: number; halfYearlyExam: number };
  term2: { periodicTest: number; notebook: number; subEnrichment: number; yearlyExam: number };
};

const classSeeds: ClassSeed[] = [
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

const studentSeeds: StudentSeed[] = [
  { regNo: '2025-8A-001', name: 'Arjun Kumar', fatherName: 'Sanjay Kumar', motherName: 'Pooja Kumar', dob: '2012-04-12', rollNo: '1', className: '8-A' },
  { regNo: '2025-8A-002', name: 'Ananya Singh', fatherName: 'Vivek Singh', motherName: 'Rita Singh', dob: '2012-09-24', rollNo: '2', className: '8-A' },
  { regNo: '2025-9A-001', name: 'Riya Patel', fatherName: 'Mahesh Patel', motherName: 'Kiran Patel', dob: '2011-01-18', rollNo: '1', className: '9-A' },
  { regNo: '2025-9A-002', name: 'Kabir Das', fatherName: 'Anil Das', motherName: 'Sangeeta Das', dob: '2011-08-07', rollNo: '2', className: '9-A' },
  { regNo: '2025-10A-001', name: 'Meera Iyer', fatherName: 'N. Iyer', motherName: 'Lakshmi Iyer', dob: '2010-03-03', rollNo: '1', className: '10-A' },
  { regNo: '2025-10A-002', name: 'Aarav Verma', fatherName: 'Rohit Verma', motherName: 'Sonia Verma', dob: '2010-11-15', rollNo: '2', className: '10-A' },
];

const markSeeds: MarkSeed[] = [
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

  await mongoose.connect(normalizeMongoUri(uri));
  console.log('Connected to MongoDB for seeding');

  await Promise.all([
    Log.deleteMany({}),
    Marks.deleteMany({}),
    Student.deleteMany({}),
    Subject.deleteMany({}),
    Class.deleteMany({}),
    Teacher.deleteMany({}),
    Lock.deleteMany({}),
  ]);

  const teacherDocs = await Teacher.insertMany(teacherSeeds.map((name) => ({ name })));
  const teacherByName = new Map(teacherDocs.map((doc) => [doc.name, doc]));

  const classDocs: any[] = [];
  const classByName = new Map<string, any>();
  const subjectByClassAndName = new Map<string, any>();

  for (const classSeed of classSeeds) {
    const classDoc = await Class.create({ name: classSeed.name, subjects: [] });
    classDocs.push(classDoc);
    classByName.set(classSeed.name, classDoc);

    const subjectDocs = await Subject.insertMany(
      classSeed.subjects.map((subject) => ({
        name: subject.name,
        classId: classDoc._id,
        maxMarks: subject.maxMarks,
      }))
    );

    for (const subjectDoc of subjectDocs) {
      subjectByClassAndName.set(`${classSeed.name}:${subjectDoc.name}`, subjectDoc);
    }

    classDoc.subjects = subjectDocs.map((subjectDoc) => subjectDoc._id) as any;
    await classDoc.save();
  }

  const studentDocs = await Student.insertMany(
    studentSeeds.map((student) => ({
      regNo: student.regNo,
      name: student.name,
      fatherName: student.fatherName,
      motherName: student.motherName,
      dob: student.dob,
      classId: classByName.get(student.className)._id,
      rollNo: student.rollNo,
    }))
  );

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

  const marksDocs = await Marks.insertMany(marksPayload);

  const englishSubjectId = subjectByClassAndName.get('10-A:English')?._id;
  const mathSubjectId = subjectByClassAndName.get('10-A:Mathematics')?._id;
  const targetStudentId = studentByRegNo.get('2025-10A-001')?._id;
  const futureClassId = classByName.get('11-Science')._id.toString();

  if (!targetStudentId || !englishSubjectId || !mathSubjectId || !futureClassId) {
    throw new Error('Seed data references could not be resolved');
  }

  await Log.insertMany([
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

  await Lock.insertMany([
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
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  });
