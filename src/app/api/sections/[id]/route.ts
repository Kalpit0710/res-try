import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sectionSchema } from "@/lib/validation";
import { fail, ok, requireAuth } from "@/lib/api";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const { id } = await context.params;
  const body = await request.json();
  const parsed = sectionSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid section payload", 400, parsed.error.flatten());

  try {
    const updated = await prisma.section.update({ where: { id }, data: parsed.data });
    return ok(updated);
  } catch (error) {
    return fail("Could not update section", 400, String(error));
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const { id } = await context.params;
  try {
    await prisma.section.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return fail("Could not delete section", 400, String(error));
  }
}
