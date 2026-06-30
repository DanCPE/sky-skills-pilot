import { cookies } from "next/headers";
import {
  getSessionCookieName,
  getTopicsWithAccessForToken,
  getUserBySessionToken,
  type AccountUser,
} from "./db";

export const GOOGLE_OAUTH_STATE_COOKIE_NAME = "sky_google_oauth_state";

export async function getCurrentAccountUser(): Promise<AccountUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  return getUserBySessionToken(token);
}

export async function getCurrentTopicsWithAccess() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  return getTopicsWithAccessForToken(token);
}

export function getAppBaseUrl(requestOrigin?: string) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    requestOrigin ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getGoogleRedirectUri(requestOrigin?: string) {
  const fallback = `${getAppBaseUrl(requestOrigin)}/api/auth/google/callback`;
  const configured = process.env.GOOGLE_REDIRECT_URI;

  if (!configured) return fallback;

  try {
    const configuredUrl = new URL(configured);
    if (configuredUrl.pathname === "/api/auth/google/callback") {
      return configured;
    }
  } catch {
    return fallback;
  }

  console.warn(
    "Ignoring GOOGLE_REDIRECT_URI because it does not point to /api/auth/google/callback.",
  );
  return fallback;
}
