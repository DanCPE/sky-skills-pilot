import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  createAccountProfile,
  deleteAccountProfile,
  getAccountOverview,
  hasAccountDatabase,
} from "@/lib/account/db";

export async function GET() {
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

  const overview = await getAccountOverview(user.profileId);
  return NextResponse.json({ profiles: overview.profiles });
}

export async function POST(request: NextRequest) {
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

  const body = (await request.json()) as { callSign?: string };
  const callSign = typeof body.callSign === "string" ? body.callSign.trim() : "";

  if (callSign.length < 2 || callSign.length > 80) {
    return NextResponse.json(
      { error: "Call sign must be between 2 and 80 characters." },
      { status: 400 },
    );
  }

  try {
    const profile = await createAccountProfile({
      fleetId: user.fleetId,
      callSign,
    });
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create account.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
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

  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) {
    return NextResponse.json(
      { error: "profileId is required." },
      { status: 400 },
    );
  }

  try {
    await deleteAccountProfile({ fleetId: user.fleetId, profileId });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete account.",
      },
      { status: 400 },
    );
  }
}
