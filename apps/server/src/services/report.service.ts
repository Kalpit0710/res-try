import path from 'path';
import ejs from 'ejs';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { Student } from '../models/Student';
import { Class } from '../models/Class';
import { Subject } from '../models/Subject';
import { Marks } from '../models/Marks';
import { calcOverallResult, calcSubjectResult } from '@srms/shared';

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

export async function generateStudentReportPdf(studentId: string): Promise<Buffer> {
  const student = await Student.findById(studentId).lean();
  if (!student) throw new Error('Student not found');

  const cls = await Class.findById(student.classId).lean();
  if (!cls) throw new Error('Class not found');

  const subjects = await Subject.find({ classId: cls._id }).sort({ name: 1 }).lean();
  const marks = await Marks.find({ studentId: student._id }).lean();
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

  const templatePath = path.join(__dirname, '../templates/reportCard.ejs');
  const html = await ejs.renderFile(templatePath, {
    schoolName: process.env.SCHOOL_NAME ?? 'School Name',
    academicSession: process.env.ACADEMIC_SESSION ?? '2025-26',
    student,
    className: cls.name,
    subjectResults,
    overall,
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
