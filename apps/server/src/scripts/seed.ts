import 'dotenv/config';
import mongoose from 'mongoose';
import { Class } from '../models/Class';
import { Subject } from '../models/Subject';
import { Teacher } from '../models/Teacher';
import { Student } from '../models/Student';
import { Marks } from '../models/Marks';
import { normalizeMongoUri } from '../config/mongoUri';

type SubjectMaxMarks = {
  term1: { periodicTest: number; notebook: number; subEnrichment: number; halfYearlyExam: number };
  term2: { periodicTest: number; notebook: number; subEnrichment: number; yearlyExam: number };
};

type ClassSeed = {
  name: string;
  classTeacherName?: string;
};

type TeacherSeed = {
  name: string;
  className?: string;
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

const sharedMaxMarks: SubjectMaxMarks = {
  term1: { periodicTest: 10, notebook: 5, subEnrichment: 5, halfYearlyExam: 30 },
  term2: { periodicTest: 10, notebook: 5, subEnrichment: 5, yearlyExam: 30 },
};

const sharedSubjectNames = [
  'English',
  'Hindi',
  'Mathematics',
  'Science',
  'Social Studies',
  'General Knowledge',
  'Computer',
  'Sanskrit',
  'Value Education',
];

const classSeeds: ClassSeed[] = [
  { name: 'Class 1', classTeacherName: 'Ramesh Gupta' },
  { name: 'Class 2', classTeacherName: 'Shweta Rao' },
  { name: 'Class 3' },
  { name: 'Class 4' },
  { name: 'Class 5' },
];

const subjectTeacherNames: Record<string, string> = {
  English: 'Meera Joshi',
  Hindi: 'Arvind Verma',
  Mathematics: 'Kunal Shah',
  Science: 'Ritu Singh',
  'Social Studies': 'Farhan Khan',
  'General Knowledge': 'Sonia Kapoor',
  Computer: 'Naveen Kumar',
  Sanskrit: 'Sushma Pandey',
  'Value Education': 'Deepa Menon',
};

const teacherSeeds: TeacherSeed[] = [
  { name: 'Ramesh Gupta', className: 'Class 1' },
  { name: 'Shweta Rao', className: 'Class 2' },
  ...Object.values(subjectTeacherNames).map((name) => ({ name })),
];

const studentSeeds: StudentSeed[] = [
  { regNo: '2026-01-001', name: 'Riya Singh', fatherName: 'Suresh Singh', motherName: 'Anjali Singh', dob: '2019-03-10', rollNo: '1', className: 'Class 1' },
  { regNo: '2026-01-002', name: 'Aman Sharma', fatherName: 'Rakesh Sharma', motherName: 'Sneha Sharma', dob: '2019-09-04', rollNo: '2', className: 'Class 1' },
  { regNo: '2026-02-001', name: 'Rohan Mehta', fatherName: 'Vikram Mehta', motherName: 'Priya Mehta', dob: '2018-12-20', rollNo: '1', className: 'Class 2' },
  { regNo: '2026-02-002', name: 'Sara Khan', fatherName: 'Imran Khan', motherName: 'Nisha Khan', dob: '2018-05-15', rollNo: '2', className: 'Class 2' },
  { regNo: '2026-03-001', name: 'Mohd. Barkaat', fatherName: 'Sandeep Sharma', motherName: 'Neha Sharma', dob: '2018-02-14', rollNo: '4', className: 'Class 3' },
  { regNo: '2026-03-002', name: 'Mohd. Subhan', fatherName: 'Manoj Verma', motherName: 'Pooja Verma', dob: '2018-07-19', rollNo: '2', className: 'Class 3' },
  { regNo: '2026-04-001', name: 'Preety Devi', fatherName: 'Rohit Singh', motherName: 'Anita Singh', dob: '2017-11-03', rollNo: '1', className: 'Class 4' },
  { regNo: '2026-04-002', name: 'Ayra Azeem', fatherName: 'Jignesh Patel', motherName: 'Kiran Patel', dob: '2017-04-25', rollNo: '2', className: 'Class 4' },
  { regNo: '2026-05-001', name: 'Arjun Iyer', fatherName: 'Vikram Iyer', motherName: 'Lakshmi Iyer', dob: '2016-08-08', rollNo: '1', className: 'Class 5' },
  { regNo: '2026-05-002', name: 'Anaya Das', fatherName: 'Sourav Das', motherName: 'Rina Das', dob: '2016-12-17', rollNo: '2', className: 'Class 5' },
];

const markBlueprints: Record<string, { term1: MarkSeed['term1']; term2: MarkSeed['term2'] }> = {
  English: { term1: { periodicTest: 9, notebook: 5, subEnrichment: 5, halfYearlyExam: 28 }, term2: { periodicTest: 9, notebook: 5, subEnrichment: 5, yearlyExam: 29 } },
  Hindi: { term1: { periodicTest: 8, notebook: 5, subEnrichment: 5, halfYearlyExam: 27 }, term2: { periodicTest: 8, notebook: 5, subEnrichment: 5, yearlyExam: 28 } },
  Mathematics: { term1: { periodicTest: 9, notebook: 4, subEnrichment: 5, halfYearlyExam: 29 }, term2: { periodicTest: 9, notebook: 5, subEnrichment: 5, yearlyExam: 30 } },
  Science: { term1: { periodicTest: 8, notebook: 5, subEnrichment: 5, halfYearlyExam: 27 }, term2: { periodicTest: 8, notebook: 5, subEnrichment: 5, yearlyExam: 28 } },
  'Social Studies': { term1: { periodicTest: 9, notebook: 5, subEnrichment: 5, halfYearlyExam: 27 }, term2: { periodicTest: 9, notebook: 5, subEnrichment: 5, yearlyExam: 28 } },
  'General Knowledge': { term1: { periodicTest: 10, notebook: 5, subEnrichment: 5, halfYearlyExam: 30 }, term2: { periodicTest: 10, notebook: 5, subEnrichment: 5, yearlyExam: 30 } },
  Computer: { term1: { periodicTest: 9, notebook: 5, subEnrichment: 5, halfYearlyExam: 29 }, term2: { periodicTest: 9, notebook: 5, subEnrichment: 5, yearlyExam: 29 } },
  Sanskrit: { term1: { periodicTest: 8, notebook: 4, subEnrichment: 5, halfYearlyExam: 26 }, term2: { periodicTest: 8, notebook: 4, subEnrichment: 5, yearlyExam: 27 } },
  'Value Education': { term1: { periodicTest: 10, notebook: 5, subEnrichment: 5, halfYearlyExam: 30 }, term2: { periodicTest: 10, notebook: 5, subEnrichment: 5, yearlyExam: 30 } },
};

function buildMarksForStudent(regNo: string, shift: number): MarkSeed[] {
  return sharedSubjectNames.map((subjectName, index) => {
    const blueprint = markBlueprints[subjectName];

    return {
      regNo,
      subjectName,
      teacherName: subjectTeacherNames[subjectName],
      term1: {
        periodicTest: Math.min(10, Math.max(0, blueprint.term1.periodicTest - (shift % 2 === 0 ? 0 : index % 2))),
        notebook: Math.min(5, Math.max(0, blueprint.term1.notebook - (shift % 3 === 0 ? 0 : index % 2))),
        subEnrichment: blueprint.term1.subEnrichment,
        halfYearlyExam: Math.min(30, Math.max(0, blueprint.term1.halfYearlyExam - shift)),
      },
      term2: {
        periodicTest: Math.min(10, Math.max(0, blueprint.term2.periodicTest - (shift % 2 === 1 ? 0 : index % 2))),
        notebook: Math.min(5, Math.max(0, blueprint.term2.notebook - (shift % 2 === 0 ? 0 : index % 2))),
        subEnrichment: blueprint.term2.subEnrichment,
        yearlyExam: Math.min(30, Math.max(0, blueprint.term2.yearlyExam - shift)),
      },
    };
  });
}

const markSeeds: MarkSeed[] = [
  ...buildMarksForStudent('2026-01-001', 1),
  ...buildMarksForStudent('2026-01-002', 2),
  ...buildMarksForStudent('2026-02-001', 1),
  ...buildMarksForStudent('2026-02-002', 2),
  ...buildMarksForStudent('2026-03-001', 3),
  ...buildMarksForStudent('2026-03-002', 4),
  ...buildMarksForStudent('2026-04-001', 5),
  ...buildMarksForStudent('2026-04-002', 6),
  ...buildMarksForStudent('2026-05-001', 7),
  ...buildMarksForStudent('2026-05-002', 8),
];

function requireDoc<T>(value: T | undefined, message: string): T {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

async function upsertClass(classSeed: ClassSeed) {
  const classDoc = await Class.findOneAndUpdate(
    { name: classSeed.name },
    { name: classSeed.name },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();

  if (!classDoc) {
    throw new Error(`Unable to upsert class ${classSeed.name}`);
  }

  return classDoc;
}

async function upsertSubject(classDoc: any, subjectName: string) {
  const subjectDoc = await Subject.findOneAndUpdate(
    { classId: classDoc._id, name: subjectName },
    { name: subjectName, classId: classDoc._id, maxMarks: sharedMaxMarks },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();

  if (!subjectDoc) {
    throw new Error(`Unable to upsert subject ${subjectName} for class ${classDoc.name}`);
  }

  return subjectDoc;
}

async function upsertTeacher(teacherSeed: TeacherSeed, classByName: Map<string, any>) {
  const update: any = { name: teacherSeed.name };
  if (teacherSeed.className) {
    const classDoc = requireDoc(classByName.get(teacherSeed.className), `Class ${teacherSeed.className} not found`);
    update.classId = classDoc._id;
  }

  const teacherDoc = await Teacher.findOneAndUpdate(
    { name: teacherSeed.name },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();

  if (!teacherDoc) {
    throw new Error(`Unable to upsert teacher ${teacherSeed.name}`);
  }

  return teacherDoc;
}

async function upsertStudent(student: StudentSeed, classByName: Map<string, any>) {
  const classDoc = requireDoc(classByName.get(student.className), `Class ${student.className} not found`);
  const studentDoc = await Student.findOneAndUpdate(
    { regNo: student.regNo },
    {
      regNo: student.regNo,
      name: student.name,
      fatherName: student.fatherName,
      motherName: student.motherName,
      dob: new Date(student.dob),
      rollNo: student.rollNo,
      classId: classDoc._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();

  if (!studentDoc) {
    throw new Error(`Unable to upsert student ${student.regNo}`);
  }

  return studentDoc;
}

async function upsertMark(mark: MarkSeed, studentByRegNo: Map<string, any>, subjectByClassAndName: Map<string, any>) {
  const studentDoc = requireDoc(studentByRegNo.get(mark.regNo), `Student ${mark.regNo} not found`);
  const className = requireDoc(
    (await Class.findById(studentDoc.classId).exec())?.name,
    `Class for ${mark.regNo} not found`
  );
  const subjectDoc = requireDoc(
    subjectByClassAndName.get(`${className}:${mark.subjectName}`),
    `Subject ${mark.subjectName} not found for class ${className}`
  );

  const marksDoc = await Marks.findOneAndUpdate(
    { studentId: studentDoc._id, subjectId: subjectDoc._id },
    {
      studentId: studentDoc._id,
      subjectId: subjectDoc._id,
      teacherName: mark.teacherName,
      term1: mark.term1,
      term2: mark.term2,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();

  if (!marksDoc) {
    throw new Error(`Unable to upsert marks for ${mark.regNo} ${mark.subjectName}`);
  }

  return marksDoc;
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is required to seed the database');
  }

  await mongoose.connect(normalizeMongoUri(uri));
  console.log('Connected to MongoDB for seeding');
  console.log('Preserving existing data and upserting new classes, subjects, teachers, students, and marks');

  const classByName = new Map<string, any>();
  const subjectByClassAndName = new Map<string, any>();

  for (const classSeed of classSeeds) {
    const classDoc = await upsertClass(classSeed);
    classByName.set(classDoc.name, classDoc);

    const subjectDocs = await Promise.all(sharedSubjectNames.map((subjectName) => upsertSubject(classDoc, subjectName)));
    for (const subjectDoc of subjectDocs) {
      subjectByClassAndName.set(`${classDoc.name}:${subjectDoc.name}`, subjectDoc);
    }

    classDoc.subjects = subjectDocs.map((subjectDoc) => subjectDoc._id as any);
    await classDoc.save();
  }

  const teacherDocs = await Promise.all(teacherSeeds.map((teacherSeed) => upsertTeacher(teacherSeed, classByName)));
  const studentDocs = await Promise.all(studentSeeds.map((student) => upsertStudent(student, classByName)));
  const studentByRegNo = new Map(studentDocs.map((doc) => [doc.regNo, doc]));

  const marksDocs = await Promise.all(markSeeds.map((mark) => upsertMark(mark, studentByRegNo, subjectByClassAndName)));

  console.log('\nSeed completed successfully');
  console.log(`Teachers: ${teacherDocs.length}`);
  console.log(`Classes: ${classByName.size}`);
  console.log(`Students: ${studentDocs.length}`);
  console.log(`Marks documents processed: ${marksDocs.length}`);
  console.log('Existing data was preserved');
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
