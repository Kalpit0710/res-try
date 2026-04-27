import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { studentSchema } from "@/lib/validation";
import { fail, ok, requireAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const q = request.nextUrl.searchParams.get("q") ?? undefined;
  const classId = request.nextUrl.searchParams.get("classId") ?? undefined;
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "20");

  const where = {
    ...(classId ? { classId } : {}),
    ...(q
      ? {
          OR: [
            { admissionNumber: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      include: { class: true, section: true },
      orderBy: [{ class: { name: "asc" } }, { section: { name: "asc" } }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return ok({ total, page, pageSize, students });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const body = await request.json();
  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid student payload", 400, parsed.error.flatten());

  try {
    const created = await prisma.student.create({
      data: {
        admissionNumber: parsed.data.admissionNumber,
        name: parsed.data.name,
        classId: parsed.data.classId,
        sectionId: parsed.data.sectionId,
        dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
        parentName: parsed.data.parentName ?? null,
        contact: parsed.data.contact ?? null,
      },
      include: { class: true, section: true },
    });
    return ok(created, 201);
  } catch (error) {
    return fail("Could not create student", 400, String(error));
  }
}
