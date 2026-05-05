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
  classTeacherName: string;
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
  { name: '3', classTeacherName: 'Anita Roy' },
  { name: '4', classTeacherName: 'Rahul Mehta' },
  { name: '5', classTeacherName: 'Priya Nair' },
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
  ...classSeeds.map((classSeed) => ({ name: classSeed.classTeacherName, className: classSeed.name })),
  ...Object.values(subjectTeacherNames).map((name) => ({ name })),
];

const studentSeeds: StudentSeed[] = [
  { regNo: '2026-03-001', name: 'Aarav Sharma', fatherName: 'Sandeep Sharma', motherName: 'Neha Sharma', dob: '2018-02-14', rollNo: '1', className: '3' },
  { regNo: '2026-03-002', name: 'Ira Verma', fatherName: 'Manoj Verma', motherName: 'Pooja Verma', dob: '2018-07-19', rollNo: '2', className: '3' },
  { regNo: '2026-04-001', name: 'Kabir Singh', fatherName: 'Rohit Singh', motherName: 'Anita Singh', dob: '2017-11-03', rollNo: '1', className: '4' },
  { regNo: '2026-04-002', name: 'Meera Patel', fatherName: 'Jignesh Patel', motherName: 'Kiran Patel', dob: '2017-04-25', rollNo: '2', className: '4' },
  { regNo: '2026-05-001', name: 'Arjun Iyer', fatherName: 'Vikram Iyer', motherName: 'Lakshmi Iyer', dob: '2016-08-08', rollNo: '1', className: '5' },
  { regNo: '2026-05-002', name: 'Anaya Das', fatherName: 'Sourav Das', motherName: 'Rina Das', dob: '2016-12-17', rollNo: '2', className: '5' },
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
  ...buildMarksForStudent('2026-03-001', 1),
  ...buildMarksForStudent('2026-04-001', 2),
  ...buildMarksForStudent('2026-05-001', 0),
];

function requireDoc<T>(value: T | undefined, message: string): T {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is required to seed the database');
  }

  await mongoose.connect(normalizeMongoUri(uri));
  console.log('Connected to MongoDB for seeding');

  await mongoose.connection.dropDatabase();
  console.log('Database cleared');

  const classDocs: any[] = [];
  const classByName = new Map<string, any>();
  const subjectByClassAndName = new Map<string, any>();

  for (const classSeed of classSeeds) {
    const classDoc = await Class.create({ name: classSeed.name, subjects: [] });
    classDocs.push(classDoc);
    classByName.set(classSeed.name, classDoc);

    const subjectDocs = await Subject.insertMany(
      sharedSubjectNames.map((name) => ({
        name,
        classId: classDoc._id,
        maxMarks: sharedMaxMarks,
      }))
    );

    for (const subjectDoc of subjectDocs) {
      subjectByClassAndName.set(`${classSeed.name}:${subjectDoc.name}`, subjectDoc);
    }

    classDoc.subjects = subjectDocs.map((subjectDoc) => subjectDoc._id) as any;
    await classDoc.save();
  }

  const teacherDocs = await Teacher.insertMany(
    teacherSeeds.map((teacherSeed) => ({
      name: teacherSeed.name,
      ...(teacherSeed.className ? { classId: requireDoc(classByName.get(teacherSeed.className), `Class ${teacherSeed.className} not found`)._id } : {}),
    }))
  );

  const studentDocs = await Student.insertMany(
    studentSeeds.map((student) => ({
      regNo: student.regNo,
      name: student.name,
      fatherName: student.fatherName,
      motherName: student.motherName,
      dob: student.dob,
      classId: requireDoc(classByName.get(student.className), `Class ${student.className} not found`)._id,
      rollNo: student.rollNo,
    }))
  );

  const studentByRegNo = new Map(studentDocs.map((doc) => [doc.regNo, doc]));

  const marksDocs = await Marks.insertMany(
    markSeeds.map((mark) => {
      const studentDoc = requireDoc(studentByRegNo.get(mark.regNo), `Student ${mark.regNo} not found`);
      const className = requireDoc(classDocs.find((classDoc) => classDoc._id.equals(studentDoc.classId))?.name, `Class for ${mark.regNo} not found`);
      const subjectDoc = requireDoc(subjectByClassAndName.get(`${className}:${mark.subjectName}`), `Subject ${mark.subjectName} not found for class ${className}`);
      const teacherName = requireDoc(subjectTeacherNames[mark.subjectName], `Teacher for ${mark.subjectName} not found`);

      return {
        studentId: studentDoc._id,
        subjectId: subjectDoc._id,
        teacherName,
        term1: mark.term1,
        term2: mark.term2,
      };
    })
  );

  console.log('\nSeed completed successfully');
  console.log(`Teachers: ${teacherDocs.length}`);
  console.log(`Classes: ${classDocs.length}`);
  console.log(`Students: ${studentDocs.length}`);
  console.log(`Marks: ${marksDocs.length}`);
  console.log('Subjects: 27');
  console.log('Database was fully cleared before seeding');
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
