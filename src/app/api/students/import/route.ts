import { prisma } from "@/lib/prisma";
import { fail, ok, requireAuth } from "@/lib/api";
import { parseStudentImport } from "@/lib/excel";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("Missing file", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedRows = parseStudentImport(buffer);

    const existing = await prisma.student.findMany({
      where: {
        admissionNumber: {
          in: parsedRows.map((row) => row.admissionNumber),
        },
      },
      select: { admissionNumber: true },
    });
    const existingSet = new Set(existing.map((item) => item.admissionNumber));

    const duplicates = parsedRows.filter((row) => existingSet.has(row.admissionNumber));
    const accepted = parsedRows.filter((row) => !existingSet.has(row.admissionNumber));

    for (const row of accepted) {
      const classRecord = await prisma.class.upsert({
        where: { name: row.className },
        update: {},
        create: { name: row.className },
      });

      const sectionRecord = await prisma.section.upsert({
        where: {
          classId_name: {
            classId: classRecord.id,
            name: row.sectionName,
          },
        },
        update: {
          classTeacherName: row.classTeacherName ?? "",
        },
        create: {
          classId: classRecord.id,
          name: row.sectionName,
          classTeacherName: row.classTeacherName ?? "",
        },
      });

      await prisma.student.create({
        data: {
          admissionNumber: row.admissionNumber,
          name: row.name,
          classId: classRecord.id,
          sectionId: sectionRecord.id,
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
          parentName: row.parentName ?? null,
          contact: row.contact ?? null,
        },
      });
    }

    return ok({
      importedCount: accepted.length,
      duplicateCount: duplicates.length,
      duplicates: duplicates.map((d) => d.admissionNumber),
    });
  } catch (error) {
    return fail("Import failed. Use strict template headers: admission_number, name, class, section", 400, String(error));
  }
}
