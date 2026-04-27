import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { classSchema } from "@/lib/validation";
import { fail, ok, requireAuth } from "@/lib/api";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const classes = await prisma.class.findMany({ orderBy: { name: "asc" } });
  return ok(classes);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const body = await request.json();
  const parsed = classSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid class payload", 400, parsed.error.flatten());

  try {
    const created = await prisma.class.create({ data: parsed.data });
    return ok(created, 201);
  } catch (error) {
    return fail("Could not create class", 400, String(error));
  }
}
