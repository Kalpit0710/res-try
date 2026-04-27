import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, setAuthCookie, verifyPassword } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid login payload", 400, parsed.error.flatten());
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      return fail("Invalid email or password", 401);
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return fail("Invalid email or password", 401);
    }

    const token = await createToken({ userId: user.id, email: user.email, role: user.role });
    await setAuthCookie(token);

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return fail("Login failed", 500, String(error));
  }
}
