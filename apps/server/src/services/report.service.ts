import path from 'path';
import ejs from 'ejs';
import puppeteer from 'puppeteer';
import fs from 'fs';
import { Branding } from '../models/Branding';
import { Student } from '../models/Student';
import { Class } from '../models/Class';
import { Subject } from '../models/Subject';
import { Marks } from '../models/Marks';
import { CoScholasticMarks } from '../models/CoScholasticMarks';
import { Remark } from '../models/Remarks';
import { Teacher } from '../models/Teacher';
import { LowerClassSubject } from '../models/LowerClassSubject';
import { LowerClassMarks } from '../models/LowerClassMarks';
import { calcOverallResult, calcSubjectResult } from '@srms/shared';

type BrowserInstance = Awaited<ReturnType<typeof puppeteer.launch>>;
let browserInstance: BrowserInstance | null = null;
let browserLaunchPromise: Promise<BrowserInstance> | null = null;

function resolveAssetDataUri(value?: string): string | null {
  if (!value) return null;
  if (value.startsWith('data:')) return value;

  const normalized = value.replace(/^\//, '');
  const absolutePath = path.resolve(process.cwd(), normalized);
  if (!fs.existsSync(absolutePath)) return null;

  const ext = path.extname(absolutePath).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg'
    ? 'image/jpeg'
    : ext === '.webp'
      ? 'image/webp'
      : 'image/png';

  const bytes = fs.readFileSync(absolutePath);
  return `data:${mime};base64,${bytes.toString('base64')}`;
}

export async function launchReportBrowser(): Promise<BrowserInstance> {
  const options: any = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  return puppeteer.launch(options);
}

export async function getReportBrowser(): Promise<BrowserInstance> {
  if (browserInstance?.connected) {
    return browserInstance;
  }

  if (!browserLaunchPromise) {
    browserLaunchPromise = launchReportBrowser()
      .then((browser) => {
        browserInstance = browser;
        browser.on('disconnected', () => {
          browserInstance = null;
          browserLaunchPromise = null;
        });
        return browser;
      })
      .catch((error) => {
        browserLaunchPromise = null;
        throw error;
      });
  }

  return browserLaunchPromise;
}

const CO_SCHOLASTIC_AREAS = ['Health & Physical Education', 'Art Education', 'Work Education'];

// Removed getCoScholasticGrade since grades are A-C strings directly

export async function generateStudentReportPdf(studentId: string, browser?: BrowserInstance): Promise<Buffer> {
  const student = await Student.findById(studentId).lean();
  if (!student) throw new Error('Student not found');

  const cls = await Class.findById(student.classId).lean();
  if (!cls) throw new Error('Class not found');

  const branding = await Branding.findOne({ key: 'singleton' }).lean();
  const classTeacher = await Teacher.findOne({ classId: cls._id }).lean();
  let teacherSignature = undefined;
  if (classTeacher) {
    teacherSignature = branding?.teacherSignatures?.find((s) => {
      return s.teacherId === classTeacher._id.toString() || 
             s.teacherName.toLowerCase() === classTeacher.name.toLowerCase();
    });
  }

  const getGrade = (percentage: number) => {
    if (percentage >= 91) return 'A1';
    if (percentage >= 81) return 'A2';
    if (percentage >= 71) return 'B1';
    if (percentage >= 61) return 'B2';
    if (percentage >= 51) return 'C1';
    if (percentage >= 41) return 'C2';
    if (percentage >= 33) return 'D';
    return 'E';
  };

  if (cls.reportCardType === 'lowerClass') {
    const subjects = await LowerClassSubject.find({ classId: cls._id }).sort({ order: 1 }).lean();
    const marks = await LowerClassMarks.find({ studentId: student._id }).lean();
    const marksMap = new Map<string, any>(marks.map(m => [m.subjectId.toString(), m]));

    let grandTotalMax = 0;
    let grandTotalObtained: number | '' = '';

    const subjectResults = subjects.map(s => {
      const m = marksMap.get(s._id.toString());
      
      let term1SubjectMax = 0;
      let term1SubjectObtained: number | '' = '';
      let term2SubjectMax = 0;
      let term2SubjectObtained: number | '' = '';

      const components = s.components.map(comp => {
        const t1 = m?.term1?.[comp.name];
        const t2 = m?.term2?.[comp.name];

        const t1Marks = (t1 !== undefined && t1 !== null) ? Number(t1) : '';
        const t2Marks = (t2 !== undefined && t2 !== null) ? Number(t2) : '';

        term1SubjectMax += comp.maxMarks;
        if (t1Marks !== '') term1SubjectObtained = (term1SubjectObtained || 0) + t1Marks;

        term2SubjectMax += comp.maxMarks;
        if (t2Marks !== '') term2SubjectObtained = (term2SubjectObtained || 0) + t2Marks;

        return {
          name: comp.name,
          maxMarks: comp.maxMarks,
          term1Marks: t1Marks,
          term2Marks: t2Marks,
          totalMax: comp.maxMarks * 2,
          totalMarks: (t1Marks === '' && t2Marks === '') ? '' : ((t1Marks || 0) + (t2Marks || 0)),
        };
      });

      const subjectTotalMax = term1SubjectMax + term2SubjectMax;
      const subjectTotalObtained = (term1SubjectObtained === '' && term2SubjectObtained === '') ? '' : ((term1SubjectObtained || 0) + (term2SubjectObtained || 0));
      
      grandTotalMax += subjectTotalMax;
      if (subjectTotalObtained !== '') grandTotalObtained = (grandTotalObtained || 0) + subjectTotalObtained;

      const percentage = (subjectTotalMax > 0 && subjectTotalObtained !== '') ? (subjectTotalObtained as number / subjectTotalMax) * 100 : 0;

      return {
        subject: s,
        components,
        term1SubjectMax,
        term1SubjectObtained,
        term2SubjectMax,
        term2SubjectObtained,
        subjectTotalMax,
        subjectTotalObtained,
        grade: subjectTotalObtained !== '' ? getGrade(percentage) : '',
      };
    });

    const overallPercentage = (grandTotalMax > 0 && grandTotalObtained !== '') ? (grandTotalObtained as number / grandTotalMax) * 100 : 0;
    const overall = {
      totalMax: grandTotalMax,
      totalObtained: grandTotalObtained,
      percentage: grandTotalObtained !== '' ? overallPercentage.toFixed(2) : '',
      overallGrade: grandTotalObtained !== '' ? getGrade(overallPercentage) : '',
    };

    const templatePath = path.join(__dirname, '../templates/reportCardLowerClass.ejs');
    const html = await ejs.renderFile(templatePath, {
      schoolName: process.env.SCHOOL_NAME ?? 'School Name',
      academicSession: process.env.ACADEMIC_SESSION ?? '2025-26',
      student,
      className: cls.name,
      subjectResults,
      overall,
      schoolLogoDataUri: resolveAssetDataUri(branding?.logoUrl),
      principalSignatureDataUri: resolveAssetDataUri(branding?.principalSignatureUrl),
      teacherSignatureDataUri: resolveAssetDataUri(teacherSignature?.signatureUrl),
      remark: (await Remark.findOne({ studentId: student._id }).lean()) ?? null,
      generatedAt: new Date(),
    });

    const activeBrowser = browser ?? await getReportBrowser();
    const page = await activeBrowser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'load' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
        preferCSSPageSize: true,
      });

      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  const subjects = await Subject.find({ classId: cls._id }).lean();
  
  const SUBJECT_ORDER = [
    'english',
    'hindi',
    'mathematics',
    'science',
    'social studies',
    'sanskrit',
    'general knowledge',
    'computer',
    'value education'
  ];

  subjects.sort((a, b) => {
    const aName = a.name.toLowerCase().trim();
    const bName = b.name.toLowerCase().trim();
    let aIndex = SUBJECT_ORDER.indexOf(aName);
    let bIndex = SUBJECT_ORDER.indexOf(bName);
    
    if (aIndex === -1) aIndex = 999;
    if (bIndex === -1) bIndex = 999;
    
    if (aIndex === bIndex) return a.name.localeCompare(b.name);
    return aIndex - bIndex;
  });
  const marks = await Marks.find({ studentId: student._id }).lean();
  const coScholasticMarks = await CoScholasticMarks.find({ studentId: student._id }).lean();
  const marksMap = new Map<string, any>(marks.map(m => [m.subjectId.toString(), m]));

  const subjectResults = subjects.map(s => {
    const m = marksMap.get(s._id.toString());
    return {
      subject: s,
      marks: m,
      result: calcSubjectResult(
        s._id.toString(),
        s.name,
        m?.term1 ?? {},
        m?.term2 ?? {},
        s.maxMarks.term1,
        s.maxMarks.term2
      ),
    };
  });

  const overall = {
    subjects: subjectResults.map(r => r.result),
    ...calcOverallResult(subjectResults.map(r => r.result)),
  };

  const coScholasticData = CO_SCHOLASTIC_AREAS.map((area) => {
    const found = coScholasticMarks.find((m: any) => m.area === area);
    return {
      area,
      term1: found?.term1,
      term2: found?.term2,
    };
  }).concat(
    coScholasticMarks
      .filter((m: any) => !CO_SCHOLASTIC_AREAS.includes(m.area))
      .map((m: any) => ({
        area: m.area,
        term1: m.term1,
        term2: m.term2,
      }))
  );

  // Teacher signature logic has been moved up
  
  // Only use the class teacher's signature if they have one uploaded
  // If no signature exists for the class teacher, leave it blank

  const templatePath = path.join(__dirname, '../templates/reportCard.ejs');
  const html = await ejs.renderFile(templatePath, {
    schoolName: process.env.SCHOOL_NAME ?? 'School Name',
    academicSession: process.env.ACADEMIC_SESSION ?? '2025-26',
    student,
    className: cls.name,
    subjectResults,
    overall,
    coScholasticMarks: coScholasticData,
    schoolLogoDataUri: resolveAssetDataUri(branding?.logoUrl),
    principalSignatureDataUri: resolveAssetDataUri(branding?.principalSignatureUrl),
    teacherSignatureDataUri: resolveAssetDataUri(teacherSignature?.signatureUrl),
    remark: (await Remark.findOne({ studentId: student._id }).lean()) ?? null,
    generatedAt: new Date(),
  });

  const activeBrowser = browser ?? await getReportBrowser();
  const page = await activeBrowser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'load' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => undefined);
  }
}
