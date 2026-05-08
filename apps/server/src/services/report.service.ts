import path from 'path';
import ejs from 'ejs';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { Branding } from '../models/Branding';
import { Student } from '../models/Student';
import { Class } from '../models/Class';
import { Subject } from '../models/Subject';
import { Marks } from '../models/Marks';
import { CoScholasticMarks } from '../models/CoScholasticMarks';
import { Remark } from '../models/Remarks';
import { Teacher } from '../models/Teacher';
import { calcOverallResult, calcSubjectResult } from '@srms/shared';

type BrowserInstance = Awaited<ReturnType<typeof puppeteer.launch>>;
let browserInstance: BrowserInstance | null = null;
let browserLaunchPromise: Promise<BrowserInstance> | null = null;

function resolveAssetDataUri(relativePath?: string): string | null {
  if (!relativePath) return null;

  const normalized = relativePath.replace(/^\//, '');
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

function resolveBrowserExecutablePath(): string {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim(),
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/microsoft-edge',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error(
    'No browser executable found. Set PUPPETEER_EXECUTABLE_PATH to a Chrome/Edge executable path.'
  );
}

export async function launchReportBrowser(): Promise<BrowserInstance> {
  return puppeteer.launch({
    headless: true,
    executablePath: resolveBrowserExecutablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

export async function getReportBrowser(): Promise<BrowserInstance> {
  if (browserInstance?.isConnected()) {
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

const CO_SCHOLASTIC_AREAS = ['Work Education', 'Art Education', 'Health & Physical Education', 'Discipline'];

function getCoScholasticGrade(marks: number | undefined): string {
  if (marks === undefined || marks === null) return '—';
  if (marks >= 91) return 'A1';
  if (marks >= 81) return 'A2';
  if (marks >= 71) return 'B1';
  if (marks >= 61) return 'B2';
  if (marks >= 51) return 'C1';
  if (marks >= 41) return 'C2';
  if (marks >= 33) return 'D';
  return 'E';
}

export async function generateStudentReportPdf(studentId: string, browser?: BrowserInstance): Promise<Buffer> {
  const student = await Student.findById(studentId).lean();
  if (!student) throw new Error('Student not found');

  const cls = await Class.findById(student.classId).lean();
  if (!cls) throw new Error('Class not found');

  const subjects = await Subject.find({ classId: cls._id }).sort({ name: 1 }).lean();
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
    const term1 = found?.term1;
    const term2 = found?.term2;
    return {
      area,
      term1,
      term2,
      grade: term1 !== undefined || term2 !== undefined
        ? getCoScholasticGrade(term1 ?? term2)
        : '—',
    };
  }).concat(
    coScholasticMarks
      .filter((m: any) => !CO_SCHOLASTIC_AREAS.includes(m.area))
      .map((m: any) => ({
        area: m.area,
        term1: m.term1,
        term2: m.term2,
        grade: m.term1 || m.term2 ? getCoScholasticGrade(m.term1 ?? m.term2) : '—',
      }))
  );

  const branding = await Branding.findOne({ key: 'singleton' }).lean();
  
  // Fetch the teacher linked to this class
  const classTeacher = await Teacher.findOne({ classId: cls._id }).lean();
  
  // Find the teacher's signature from branding
  let teacherSignature = undefined;
  if (classTeacher) {
    teacherSignature = branding?.teacherSignatures?.find((s) => {
      return s.teacherId === classTeacher._id.toString() || 
             s.teacherName.toLowerCase() === classTeacher.name.toLowerCase();
    });
  }
  
  // Fallback: use first marked teacher's signature if class teacher doesn't have one
  if (!teacherSignature) {
    const firstMarkedTeacher = marks.find((m) => Boolean(m.teacherName))?.teacherName?.trim();
    teacherSignature = branding?.teacherSignatures?.find((s) => {
      if (!firstMarkedTeacher) return false;
      return s.teacherId === firstMarkedTeacher || s.teacherName.toLowerCase() === firstMarkedTeacher.toLowerCase();
    }) ?? branding?.teacherSignatures?.[0];
  }

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
    await page.setContent(html, { waitUntil: 'networkidle0' });

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
