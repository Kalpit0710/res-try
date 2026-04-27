import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { classSubjectSchema } from "@/lib/validation";
import { fail, ok, requireAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const classId = request.nextUrl.searchParams.get("classId") ?? undefined;

  const mappings = await prisma.classSubject.findMany({
    where: classId ? { classId } : undefined,
    include: { class: true, subject: true },
    orderBy: [{ class: { name: "asc" } }, { subject: { name: "asc" } }],
  });

  return ok(mappings);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const body = await request.json();
  const parsed = classSubjectSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid class subject payload", 400, parsed.error.flatten());

  try {
    const created = await prisma.classSubject.create({ data: parsed.data, include: { class: true, subject: true } });
    return ok(created, 201);
  } catch (error) {
    return fail("Could not create class subject mapping", 400, String(error));
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const body = await request.json();
  const parsed = classSubjectSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid class subject payload", 400, parsed.error.flatten());

  try {
    await prisma.classSubject.delete({
      where: {
        classId_subjectId: {
          classId: parsed.data.classId,
          subjectId: parsed.data.subjectId,
        },
      },
    });
    return ok({ deleted: true });
  } catch (error) {
    return fail("Could not delete class subject mapping", 400, String(error));
  }
}
