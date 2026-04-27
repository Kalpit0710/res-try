import { prisma } from "@/lib/prisma";
import { fail, ok, requireAuth } from "@/lib/api";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const [students, classes, sections, subjects, results] = await Promise.all([
    prisma.student.count(),
    prisma.class.count(),
    prisma.section.count(),
    prisma.subject.count(),
    prisma.result.count(),
  ]);

  return ok({ students, classes, sections, subjects, results });
}
