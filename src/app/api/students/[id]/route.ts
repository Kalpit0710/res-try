import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { studentSchema } from "@/lib/validation";
import { fail, ok, requireAuth } from "@/lib/api";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const { id } = await context.params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      class: true,
      section: true,
      marks: {
        include: { subject: true },
      },
      results: true,
    },
  });

  if (!student) return fail("Student not found", 404);
  return ok(student);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const { id } = await context.params;
  const body = await request.json();
  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid student payload", 400, parsed.error.flatten());

  try {
    const current = await prisma.student.findUnique({ where: { id } });
    if (!current) return fail("Student not found", 404);

    if (current.admissionNumber !== parsed.data.admissionNumber) {
      return fail("Admission number cannot be edited", 400);
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        name: parsed.data.name,
        classId: parsed.data.classId,
        sectionId: parsed.data.sectionId,
        dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
        parentName: parsed.data.parentName ?? null,
        contact: parsed.data.contact ?? null,
      },
      include: { class: true, section: true },
    });

    return ok(updated);
  } catch (error) {
    return fail("Could not update student", 400, String(error));
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const { id } = await context.params;
  try {
    await prisma.student.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return fail("Could not delete student", 400, String(error));
  }
}
