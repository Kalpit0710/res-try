import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { fail, ok, requireAuth } from "@/lib/api";
import { gradeRangesSchema } from "@/lib/validation";

const DEFAULT_RANGES = [
  { min: 90, max: 100, grade: "A+" },
  { min: 75, max: 89.99, grade: "A" },
  { min: 60, max: 74.99, grade: "B" },
  { min: 45, max: 59.99, grade: "C" },
  { min: 33, max: 44.99, grade: "D" },
  { min: 0, max: 32.99, grade: "F" },
];

export async function POST(request: NextRequest) {
  const userCount = await prisma.user.count();

  if (userCount > 0) {
    const auth = await requireAuth();
    if (!auth) {
      return fail("Unauthorized", 401);
    }
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const parsed = gradeRangesSchema.safeParse({ ranges: payload.ranges ?? DEFAULT_RANGES });

    if (!parsed.success) {
      return fail("Invalid grading ranges", 400, parsed.error.flatten());
    }

    if (userCount === 0) {
      const password = process.env.ADMIN_PASSWORD ?? "admin123";
      const email = process.env.ADMIN_EMAIL ?? "admin@school.local";
      const name = process.env.ADMIN_NAME ?? "School Admin";

      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: await hashPassword(password),
          role: "ADMIN",
        },
      });
    }

    await prisma.gradeRange.deleteMany();
    await prisma.gradeRange.createMany({ data: parsed.data.ranges });

    return ok({ initialized: true, ranges: parsed.data.ranges });
  } catch (error) {
    return fail("Seed failed", 500, String(error));
  }
}
