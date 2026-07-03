/**
 * One-off: drop all students and repopulate from a CSV.
 * Reads DOB as m/d/yyyy (US), inserts as native Date.
 * Usage:  ts-node src/scripts/replaceStudents.ts <path-to-csv>
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Class } from '../models/Class';
import { Student } from '../models/Student';

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0 && l.replace(/,/g, '').trim().length > 0);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) row[headers[j]] = (cols[j] ?? '').trim();
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (c === ',' && !inQuotes) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

function parseUsDate(v: string): Date | null {
  const m = v.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!m) return null;
  const mm = Number(m[1]);
  const dd = Number(m[2]);
  const yyyy = Number(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (d.getUTCMonth() !== mm - 1 || d.getUTCDate() !== dd) return null;
  return d;
}

async function main() {
  const csvPath = process.argv[2] ?? path.resolve(process.cwd(), '..', '..', 'students-template-2.csv');
  if (!fs.existsSync(csvPath)) throw new Error(`CSV not found: ${csvPath}`);

  await connectDB();
  console.log(`Loaded CSV: ${csvPath}`);
  const text = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(text);
  console.log(`Rows found: ${rows.length}`);

  const rawClassNames = [...new Set(rows.map((r) => r.class?.trim()).filter(Boolean))];
  // Try each raw name AND its "Class <name>" variant to handle "UKG" vs "Class UKG".
  const candidateNames = [...new Set(rawClassNames.flatMap((n) => [n, `Class ${n}`]))];
  const classes = await Class.find({ name: { $in: candidateNames } }).lean();
  const byName = new Map(classes.map((c) => [c.name, c._id.toString()]));
  const classMap = new Map<string, string>();
  for (const raw of rawClassNames) {
    const id = byName.get(raw) ?? byName.get(`Class ${raw}`);
    if (id) classMap.set(raw, id);
  }

  const missing = rawClassNames.filter((n) => !classMap.has(n));
  if (missing.length > 0) {
    console.error('Missing classes in DB (create them first, aborting):', missing);
    await mongoose.disconnect();
    process.exit(1);
  }

  const seen = new Set<string>();
  const docs: any[] = [];
  const rejected: Array<{ row: number; regNo: string; reason: string }> = [];

  rows.forEach((r, idx) => {
    const regNo = r.regNo?.trim();
    const name = r.name?.trim();
    const className = r.class?.trim();
    if (!regNo || !name || !className) {
      rejected.push({ row: idx + 2, regNo: regNo ?? '', reason: 'missing regNo/name/class' });
      return;
    }
    if (seen.has(regNo)) {
      rejected.push({ row: idx + 2, regNo, reason: 'duplicate regNo within CSV' });
      return;
    }
    seen.add(regNo);

    let dob: Date | undefined;
    if (r.dob) {
      const parsed = parseUsDate(r.dob);
      if (!parsed) {
        rejected.push({ row: idx + 2, regNo, reason: `invalid DOB: ${r.dob}` });
        return;
      }
      dob = parsed;
    }

    docs.push({
      regNo,
      name,
      fatherName: r.fatherName?.trim() || undefined,
      motherName: r.motherName?.trim() || undefined,
      dob,
      classId: classMap.get(className),
      rollNo: r.rollNo?.trim() || undefined,
    });
  });

  if (rejected.length > 0) {
    console.warn(`Rejected ${rejected.length} rows before insert:`);
    rejected.forEach((r) => console.warn(`  row ${r.row} regNo=${r.regNo}: ${r.reason}`));
  }

  console.log(`Deleting all existing students...`);
  const del = await Student.deleteMany({});
  console.log(`  Deleted ${del.deletedCount} student docs.`);

  console.log(`Inserting ${docs.length} new students...`);
  const inserted = await Student.insertMany(docs, { ordered: false });
  console.log(`  Inserted ${inserted.length} students.`);

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(async (err) => {
  console.error('FAILED:', err);
  try { await mongoose.disconnect(); } catch { /* noop */ }
  process.exit(1);
});
