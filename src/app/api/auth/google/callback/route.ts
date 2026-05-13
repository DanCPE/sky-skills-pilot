import { NextRequest, NextResponse } from "next/server";
import {
  getAppBaseUrl,
  getGoogleRedirectUri,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
} from "@/lib/account/auth";
import {
  createRawSessionToken,
  createSession,
  getDefaultProfileForFleet,
  getSessionCookieName,
  getSessionCookieOptions,
  hashSessionIp,
  hasAccountDatabase,
  upsertGoogleUser,
} from "@/lib/account/db";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

function redirectWithError(request: NextRequest, error: string) {
  const url = new URL("/sign-in", getAppBaseUrl(request.nextUrl.origin));
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return redirectWithError(request, "Google sign-in is not configured.");
  }

  if (!hasAccountDatabase()) {
    return redirectWithError(request, "Account database is not configured.");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE_NAME)?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return redirectWithError(request, "Google sign-in could not be verified.");
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(request.nextUrl.origin),
      grant_type: "authorization_code",
    }),
  });

  const tokenJson = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenResponse.ok || !tokenJson.access_token) {
    return redirectWithError(
      request,
      tokenJson.error_description || tokenJson.error || "Google sign-in failed.",
    );
  }

  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profile = (await userInfoResponse.json()) as GoogleUserInfo;

  if (
    !userInfoResponse.ok ||
    !profile.sub ||
    !profile.email ||
    !profile.email_verified
  ) {
    return redirectWithError(
      request,
      "Google account email must be verified before signing in.",
    );
  }

  const user = await upsertGoogleUser({
    sub: profile.sub,
    email: profile.email,
    email_verified: profile.email_verified,
    name: profile.name,
    picture: profile.picture,
  });
  const rawSessionToken = createRawSessionToken();
  const defaultProfile = await getDefaultProfileForFleet(user.fleetId);
  try {
    await createSession({
      fleetId: user.fleetId,
      profileId: defaultProfile.id,
      rawToken: rawSessionToken,
      ipHash: hashSessionIp(getClientIp(request)),
    });
  } catch (error) {
    return redirectWithError(
      request,
      error instanceof Error ? error.message : "Could not create account session.",
    );
  }

  const callbackUrl = request.cookies.get("sky_auth_callback")?.value || "/account";
  const redirectUrl = new URL(callbackUrl, getAppBaseUrl(request.nextUrl.origin));
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set(
    getSessionCookieName(),
    rawSessionToken,
    getSessionCookieOptions(),
  );
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE_NAME);
  response.cookies.delete("sky_auth_callback");

  return response;
}
