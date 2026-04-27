import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, requireAuth } from "@/lib/api";
import { gradeRangesSchema } from "@/lib/validation";
import { normalizeRanges } from "@/lib/grade";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const ranges = await prisma.gradeRange.findMany({ orderBy: { min: "asc" } });
  return ok(ranges);
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const body = await request.json();
  const parsed = gradeRangesSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid grading payload", 400, parsed.error.flatten());

  const ranges = normalizeRanges(parsed.data.ranges);

  for (let index = 0; index < ranges.length; index += 1) {
    const current = ranges[index];
    if (current.min > current.max) return fail("Each grade range must have min <= max", 400);
    if (index > 0 && current.min < ranges[index - 1].min) return fail("Ranges must be sorted", 400);
  }

  await prisma.gradeRange.deleteMany();
  await prisma.gradeRange.createMany({ data: ranges });

  return ok(ranges);
}
