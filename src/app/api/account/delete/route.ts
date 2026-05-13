import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  deleteAccount,
  getExpiredSessionCookieOptions,
  getSessionCookieName,
  hasAccountDatabase,
} from "@/lib/account/db";

export async function DELETE() {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  const user = await getCurrentAccountUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  await deleteAccount(user.fleetId);

  const response = NextResponse.json({ deleted: true });
  response.cookies.set(
    getSessionCookieName(),
    "",
    getExpiredSessionCookieOptions(),
  );
  return response;
}
