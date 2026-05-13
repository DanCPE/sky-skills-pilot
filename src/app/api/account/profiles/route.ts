import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  createAccountProfile,
  deleteAccountProfile,
  getAccountOverview,
  hasAccountDatabase,
} from "@/lib/account/db";

function routeDebug(message: string, meta?: Record<string, unknown>) {
  console.log(`[account-profiles] ${message}`, meta ?? {});
}

function routeError(
  message: string,
  error: unknown,
  meta?: Record<string, unknown>,
) {
  console.error(`[account-profiles] ${message}`, {
    ...(meta ?? {}),
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

export async function GET() {
  const startedAt = Date.now();

  try {
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
    routeDebug("list ok", {
      fleetId: user.fleetId,
      profileId: user.profileId,
      profileCount: overview.profiles.length,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ profiles: overview.profiles });
  } catch (error) {
    routeError("list failed", error, { durationMs: Date.now() - startedAt });
    return NextResponse.json(
      { error: "Could not load accounts." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();

  try {
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
    const callSign =
      typeof body.callSign === "string" ? body.callSign.trim() : "";

    if (callSign.length < 2 || callSign.length > 80) {
      return NextResponse.json(
        { error: "Call sign must be between 2 and 80 characters." },
        { status: 400 },
      );
    }

    const profile = await createAccountProfile({
      fleetId: user.fleetId,
      callSign,
    });
    routeDebug("create ok", {
      fleetId: user.fleetId,
      profileId: profile.id,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    routeError("create failed", error, { durationMs: Date.now() - startedAt });
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
  const startedAt = Date.now();

  try {
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

    await deleteAccountProfile({ fleetId: user.fleetId, profileId });
    routeDebug("delete ok", {
      fleetId: user.fleetId,
      profileId,
      activeProfileId: user.profileId,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    routeError("delete failed", error, { durationMs: Date.now() - startedAt });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete account.",
      },
      { status: 400 },
    );
  }
}
