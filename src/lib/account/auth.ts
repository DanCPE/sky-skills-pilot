import { cookies } from "next/headers";
import {
  getSessionCookieName,
  getUserBySessionToken,
  type AccountUser,
} from "./db";

export const GOOGLE_OAUTH_STATE_COOKIE_NAME = "sky_google_oauth_state";

export async function getCurrentAccountUser(): Promise<AccountUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  return getUserBySessionToken(token);
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
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    `${getAppBaseUrl(requestOrigin)}/api/auth/google/callback`
  );
}
