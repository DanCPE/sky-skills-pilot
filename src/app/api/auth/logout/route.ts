import { NextRequest, NextResponse } from "next/server";
import {
  deleteSession,
  getExpiredSessionCookieOptions,
  getSessionCookieName,
} from "@/lib/account/db";

async function clearSessionAndRedirect(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (token) {
    await deleteSession(token);
  }

  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin), {
    status: 303,
  });
  response.cookies.set(
    getSessionCookieName(),
    "",
    getExpiredSessionCookieOptions(),
  );
  return response;
}

export async function POST(request: NextRequest) {
  return clearSessionAndRedirect(request);
}

export async function GET(request: NextRequest) {
  return clearSessionAndRedirect(request);
}
