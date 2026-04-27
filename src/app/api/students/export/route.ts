import { buildStudentExport } from "@/lib/excel";
import { prisma } from "@/lib/prisma";
import { fail, requireAuth } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const students = await prisma.student.findMany({
    include: { class: true, section: true },
    orderBy: [{ class: { name: "asc" } }, { section: { name: "asc" } }, { name: "asc" }],
  });

  const buffer = buildStudentExport(
    students.map((student) => ({
      admission_number: student.admissionNumber,
      name: student.name,
      class: student.class.name,
      section: student.section.name,
      date_of_birth: student.dateOfBirth ? student.dateOfBirth.toISOString().slice(0, 10) : "",
      parent_name: student.parentName ?? "",
      contact: student.contact ?? "",
      class_teacher_name: student.section.classTeacherName,
    })),
  );

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=students.xlsx",
    },
  });
}
