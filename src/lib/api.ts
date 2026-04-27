import { NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth";

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, message, details }, { status });
}

export async function requireAuth() {
  const payload = await getAuthPayload();
  if (!payload) {
    return null;
  }
  return payload;
}
