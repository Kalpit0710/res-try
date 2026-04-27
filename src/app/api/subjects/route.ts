import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { subjectSchema } from "@/lib/validation";
import { fail, ok, requireAuth } from "@/lib/api";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
  return ok(subjects);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const body = await request.json();
  const parsed = subjectSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid subject payload", 400, parsed.error.flatten());

  try {
    const created = await prisma.subject.create({ data: parsed.data });
    return ok(created, 201);
  } catch (error) {
    return fail("Could not create subject", 400, String(error));
  }
}
