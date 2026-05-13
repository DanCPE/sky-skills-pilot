import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import { hasAccountDatabase } from "@/lib/account/db";

export async function GET() {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { user: null, configured: false },
      { status: 200 },
    );
  }

  const user = await getCurrentAccountUser();
  if (!user) {
    return NextResponse.json({ user: null, configured: true }, { status: 200 });
  }

  return NextResponse.json({ user, configured: true });
}
