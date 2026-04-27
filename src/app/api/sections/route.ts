import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sectionSchema } from "@/lib/validation";
import { fail, ok, requireAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const classId = request.nextUrl.searchParams.get("classId") ?? undefined;

  const sections = await prisma.section.findMany({
    where: classId ? { classId } : undefined,
    include: { class: true },
    orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
  });

  return ok(sections);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const body = await request.json();
  const parsed = sectionSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid section payload", 400, parsed.error.flatten());

  try {
    const created = await prisma.section.create({ data: parsed.data });
    return ok(created, 201);
  } catch (error) {
    return fail("Could not create section", 400, String(error));
  }
}
