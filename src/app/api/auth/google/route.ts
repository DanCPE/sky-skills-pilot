import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleRedirectUri,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
} from "@/lib/account/auth";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID is not configured." },
      { status: 500 },
    );
  }

  const requestOrigin = request.nextUrl.origin;
  const state = randomBytes(24).toString("base64url");
  const callbackUrl =
    request.nextUrl.searchParams.get("callbackUrl") || "/account";

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", getGoogleRedirectUri(requestOrigin));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });
  response.cookies.set("sky_auth_callback", callbackUrl, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  return response;
}
