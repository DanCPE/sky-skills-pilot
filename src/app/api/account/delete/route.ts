import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  deleteAccount,
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

  await deleteAccount(user.id);

  const response = NextResponse.json({ deleted: true });
  response.cookies.delete(getSessionCookieName());
  return response;
}
