import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, requireAuth } from "@/lib/api";
import { marksBulkSchema } from "@/lib/validation";
import { recomputeStudentResult } from "@/lib/result";

export async function GET(_: NextRequest, context: { params: Promise<{ studentId: string }> }) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const { studentId } = await context.params;

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
      marks: true,
      results: true,
    },
  });

  if (!student) return fail("Student not found", 404);

  const marksBySubject = new Map(student.marks.map((mark) => [mark.subjectId, mark]));
  const rows = student.class.subjects.map((classSubject) => {
    const mark = marksBySubject.get(classSubject.subjectId);
    const halfYearlyMarks = mark?.halfYearlyMarks ?? 0;
    const finalTermMarks = mark?.finalTermMarks ?? 0;
    return {
      subjectId: classSubject.subjectId,
      subjectName: classSubject.subject.name,
      halfYearlyMarks,
      finalTermMarks,
      totalMarks: Number((halfYearlyMarks + finalTermMarks).toFixed(2)),
    };
  });

  return ok({
    student: {
      id: student.id,
      admissionNumber: student.admissionNumber,
      name: student.name,
      className: student.class.name,
      sectionName: student.section.name,
    },
    rows,
    result: student.results[0] ?? null,
  });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ studentId: string }> }) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const { studentId } = await context.params;
  const body = await request.json();
  const parsed = marksBulkSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid marks payload", 400, parsed.error.flatten());

  try {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return fail("Student not found", 404);

    await prisma.$transaction(
      parsed.data.marks.map((row) =>
        prisma.mark.upsert({
          where: {
            studentId_subjectId: {
              studentId,
              subjectId: row.subjectId,
            },
          },
          update: {
            halfYearlyMarks: row.halfYearlyMarks,
            finalTermMarks: row.finalTermMarks,
            totalMarks: Number((row.halfYearlyMarks + row.finalTermMarks).toFixed(2)),
          },
          create: {
            studentId,
            subjectId: row.subjectId,
            halfYearlyMarks: row.halfYearlyMarks,
            finalTermMarks: row.finalTermMarks,
            totalMarks: Number((row.halfYearlyMarks + row.finalTermMarks).toFixed(2)),
          },
        }),
      ),
    );

    const summary = await recomputeStudentResult(studentId);
    return ok(summary);
  } catch (error) {
    return fail("Could not save marks", 400, String(error));
  }
}
