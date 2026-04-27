import * as XLSX from "xlsx";

export type ImportedStudentRow = {
  admissionNumber: string;
  name: string;
  className: string;
  sectionName: string;
  dateOfBirth?: string;
  parentName?: string;
  contact?: string;
  classTeacherName?: string;
};

const REQUIRED_HEADERS = ["admission_number", "name", "class", "section"];

export function parseStudentImport(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error("Missing worksheet");
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false, defval: "" });

  const headers = Object.keys(rows[0] ?? {}).map((h) => h.toLowerCase().trim());
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required header: ${required}`);
    }
  }

  const parsed: ImportedStudentRow[] = rows
    .map((row) => ({
      admissionNumber: String(row.admission_number || "").trim(),
      name: String(row.name || "").trim(),
      className: String(row.class || "").trim(),
      sectionName: String(row.section || "").trim(),
      dateOfBirth: String(row.date_of_birth || "").trim() || undefined,
      parentName: String(row.parent_name || "").trim() || undefined,
      contact: String(row.contact || "").trim() || undefined,
      classTeacherName: String(row.class_teacher_name || "").trim() || undefined,
    }))
    .filter((row) => row.admissionNumber && row.name && row.className && row.sectionName);

  return parsed;
}

export function buildStudentExport(rows: Array<Record<string, unknown>>) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "students");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function buildResultExport(rows: Array<Record<string, unknown>>) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "results");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
