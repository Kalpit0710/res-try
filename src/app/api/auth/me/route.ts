import { requireAuth, fail, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const payload = await requireAuth();
  if (!payload) {
    return fail("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    return fail("Unauthorized", 401);
  }

  return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
}
