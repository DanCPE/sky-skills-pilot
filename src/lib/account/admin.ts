import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "./auth";
import type { AccountUser } from "./db";

export const ADMIN_ACCOUNT_EMAILS = [
  "skyskills.contact@gmail.com",
  "atitaya.jsn@gmail.com",
  "dan615415@gmail.com",
  "teawafieldverse@gmail.com",
] as const;

const adminAccountEmailSet = new Set<string>(ADMIN_ACCOUNT_EMAILS);

export function isAdminAccountUser(
  user: Pick<AccountUser, "email"> | null | undefined,
) {
  return Boolean(user?.email && adminAccountEmailSet.has(user.email.toLowerCase()));
}

export async function getCurrentAdminAccountUser() {
  const user = await getCurrentAccountUser();
  return isAdminAccountUser(user) ? user : null;
}

export async function requireAdminApiAccess(request: Request) {
  const adminUser = await getCurrentAdminAccountUser();
  if (adminUser) return null;

  return NextResponse.redirect(new URL("/", request.url), 303);
}
