import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, requireAuth } from "@/lib/api";
import { recomputeStudentResult } from "@/lib/result";
import { generateReportPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ studentId: string }> }) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const { studentId } = await context.params;
  const format = request.nextUrl.searchParams.get("format") ?? "json";

  await recomputeStudentResult(studentId);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
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
  });

  if (!student) return fail("Student not found", 404);

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

  const payload = {
    schoolName: "Springfield Public School",
    student: {
      name: student.name,
      admissionNumber: student.admissionNumber,
      className: student.class.name,
      sectionName: student.section.name,
      classTeacherName: student.section.classTeacherName,
    },
    rows,
    summary: {
      grandTotal: result.grandTotal,
      maxTotal: result.maxTotal,
      percentage: result.percentage,
      grade: result.grade,
      principalName: "Principal",
    },
  };

  if (format === "pdf") {
    const pdf = await generateReportPdf({
      schoolName: payload.schoolName,
      studentName: payload.student.name,
      admissionNumber: payload.student.admissionNumber,
      className: payload.student.className,
      sectionName: payload.student.sectionName,
      classTeacherName: payload.student.classTeacherName,
      principalName: payload.summary.principalName,
      rows,
      grandTotal: payload.summary.grandTotal,
      maxTotal: payload.summary.maxTotal,
      percentage: payload.summary.percentage,
      grade: payload.summary.grade,
    });

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=report-${student.admissionNumber}.pdf`,
      },
    });
  }

  return ok(payload);
}
