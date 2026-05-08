import { NextRequest, NextResponse } from "next/server";
import {
  deleteSession,
  getExpiredSessionCookieOptions,
  getSessionCookieName,
} from "@/lib/account/db";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (token) {
    await deleteSession(token);
  }

  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin));
  response.cookies.set(
    getSessionCookieName(),
    "",
    getExpiredSessionCookieOptions(),
  );
  return response;
}
