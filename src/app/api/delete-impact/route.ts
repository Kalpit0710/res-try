import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, requireAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const entity = request.nextUrl.searchParams.get("entity");
  const id = request.nextUrl.searchParams.get("id");

  if (!entity || !id) {
    return fail("Missing entity or id", 400);
  }

  if (entity === "class") {
    const classRecord = await prisma.class.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!classRecord) return fail("Class not found", 404);

    const [sections, students, classSubjects, results] = await Promise.all([
      prisma.section.count({ where: { classId: id } }),
      prisma.student.count({ where: { classId: id } }),
      prisma.classSubject.count({ where: { classId: id } }),
      prisma.result.count({ where: { classId: id } }),
    ]);

    return ok({
      entity,
      id,
      name: classRecord.name,
      counts: { sections, students, classSubjects, results },
    });
  }

  if (entity === "section") {
    const sectionRecord = await prisma.section.findUnique({
      where: { id },
      include: { class: true },
    });
    if (!sectionRecord) return fail("Section not found", 404);

    const students = await prisma.student.count({ where: { sectionId: id } });

    return ok({
      entity,
      id,
      name: `${sectionRecord.class.name} - ${sectionRecord.name}`,
      counts: { students },
    });
  }

  if (entity === "subject") {
    const subjectRecord = await prisma.subject.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!subjectRecord) return fail("Subject not found", 404);

    const [classMappings, marks] = await Promise.all([
      prisma.classSubject.count({ where: { subjectId: id } }),
      prisma.mark.count({ where: { subjectId: id } }),
    ]);

    return ok({
      entity,
      id,
      name: subjectRecord.name,
      counts: { classMappings, marks },
    });
  }

  if (entity === "student") {
    const studentRecord = await prisma.student.findUnique({
      where: { id },
      include: { class: true, section: true },
    });
    if (!studentRecord) return fail("Student not found", 404);

    const [marks, results] = await Promise.all([
      prisma.mark.count({ where: { studentId: id } }),
      prisma.result.count({ where: { studentId: id } }),
    ]);

    return ok({
      entity,
      id,
      name: `${studentRecord.name} (${studentRecord.admissionNumber})`,
      counts: { marks, results, className: studentRecord.class.name, sectionName: studentRecord.section.name },
    });
  }

  return fail("Unsupported entity", 400);
}
