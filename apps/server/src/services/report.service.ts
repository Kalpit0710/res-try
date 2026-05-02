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
import { calcOverallResult, calcSubjectResult } from '@srms/shared';

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
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (fromEnv) return fromEnv;

  // Common Windows installs (best-effort, optional)
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error(
    'No browser executable found. Set PUPPETEER_EXECUTABLE_PATH to a Chrome/Edge executable path.'
  );
}

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

export async function generateStudentReportPdf(studentId: string): Promise<Buffer> {
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

  const coScholasticData = coScholasticMarks.map((m: any) => ({
    area: m.area,
    term1: m.term1,
    term2: m.term2,
    grade: m.term1 || m.term2 ? getCoScholasticGrade(m.term1 ?? m.term2) : '—',
  }));

  const branding = await Branding.findOne({ key: 'singleton' }).lean();
  const firstMarkedTeacher = marks.find((m) => Boolean(m.teacherName))?.teacherName?.trim();
  const teacherSignature = branding?.teacherSignatures?.find((s) => {
    if (!firstMarkedTeacher) return false;
    return s.teacherId === firstMarkedTeacher || s.teacherName.toLowerCase() === firstMarkedTeacher.toLowerCase();
  }) ?? branding?.teacherSignatures?.[0];

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
    generatedAt: new Date(),
  });

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: resolveBrowserExecutablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
