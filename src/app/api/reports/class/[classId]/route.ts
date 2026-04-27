import JSZip from "jszip";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, requireAuth } from "@/lib/api";
import { recomputeStudentResult } from "@/lib/result";
import { generateReportPdf } from "@/lib/pdf";

export const runtime = "nodejs";

function safeFileName(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function GET(_: NextRequest, context: { params: Promise<{ classId: string }> }) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const { classId } = await context.params;

  const classRecord = await prisma.class.findUnique({ where: { id: classId } });
  if (!classRecord) return fail("Class not found", 404);

  const studentIds = await prisma.student.findMany({
    where: { classId },
    select: { id: true },
  });

  if (studentIds.length === 0) {
    return fail("No students found for this class", 404);
  }

  for (const row of studentIds) {
    await recomputeStudentResult(row.id);
  }

  const students = await prisma.student.findMany({
    where: { classId },
    include: {
      class: {
        include: {
          subjects: {
            include: { subject: true },
            orderBy: { subject: { name: "asc" } },
          },
        },
      },
      section: true,
      marks: {
        include: { subject: true },
      },
      results: true,
    },
    orderBy: [{ section: { name: "asc" } }, { name: "asc" }],
  });

  const zip = new JSZip();

  for (const student of students) {
    const markMap = new Map(student.marks.map((item) => [item.subjectId, item]));
    const rows = student.class.subjects.map((classSubject) => {
      const mark = markMap.get(classSubject.subjectId);
      const half = mark?.halfYearlyMarks ?? 0;
      const final = mark?.finalTermMarks ?? 0;
      return {
        subject: classSubject.subject.name,
        half,
        final,
        total: Number((half + final).toFixed(2)),
      };
    });

    const result = student.results[0] ?? {
      grandTotal: 0,
      maxTotal: rows.length * 200,
      percentage: 0,
      grade: "N/A",
    };

    const pdf = await generateReportPdf({
      schoolName: "Springfield Public School",
      studentName: student.name,
      admissionNumber: student.admissionNumber,
      className: student.class.name,
      sectionName: student.section.name,
      classTeacherName: student.section.classTeacherName,
      principalName: "Principal",
      rows,
      grandTotal: result.grandTotal,
      maxTotal: result.maxTotal,
      percentage: result.percentage,
      grade: result.grade,
    });

    const fileName = `${safeFileName(student.admissionNumber)}-${safeFileName(student.name)}.pdf`;
    zip.file(fileName, pdf);
  }

  const className = safeFileName(classRecord.name) || "class";
  const archiveName = `report-cards-${className}.zip`;
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename=${archiveName}`,
    },
  });
}
