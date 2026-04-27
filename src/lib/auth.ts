import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const AUTH_COOKIE = "srms_auth";
const ALG = "HS256";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: { userId: string; email: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getJwtSecret());
}

export async function verifyToken(token: string) {
  const verified = await jwtVerify(token, getJwtSecret(), { algorithms: [ALG] });
  return verified.payload as { userId: string; email: string; role: string };
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}

export async function getAuthPayload() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}
