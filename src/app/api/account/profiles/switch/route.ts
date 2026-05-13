import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  getSessionCookieName,
  hasAccountDatabase,
  switchSessionProfile,
} from "@/lib/account/db";

export async function POST(request: NextRequest) {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  const user = await getCurrentAccountUser();
  const token = request.cookies.get(getSessionCookieName())?.value;

  if (!user || !token) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json()) as { profileId?: string };
  if (!body.profileId) {
    return NextResponse.json(
      { error: "profileId is required." },
      { status: 400 },
    );
  }

  try {
    await switchSessionProfile({
      rawToken: token,
      fleetId: user.fleetId,
      profileId: body.profileId,
    });
    return NextResponse.json({ switched: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not switch account.",
      },
      { status: 400 },
    );
  }
}
