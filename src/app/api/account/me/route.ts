import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import { hasAccountDatabase, getProfileRank, getActivePackageForFleet } from "@/lib/account/db";

function routeDebug(message: string, meta?: Record<string, unknown>) {
  console.log(`[account-me] ${message}`, meta ?? {});
}

function routeError(
  message: string,
  error: unknown,
  meta?: Record<string, unknown>,
) {
  console.error(`[account-me] ${message}`, {
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
        { user: null, configured: false },
        { status: 200 },
      );
    }

    const user = await getCurrentAccountUser();
    routeDebug("resolved", {
      hasUser: Boolean(user),
      fleetId: user?.fleetId,
      profileId: user?.profileId,
      durationMs: Date.now() - startedAt,
    });

    if (!user) {
      return NextResponse.json({ user: null, configured: true }, { status: 200 });
    }

    const [rank, activePackage] = await Promise.all([
      user.profileId ? getProfileRank(user.profileId).catch(() => null) : null,
      user.fleetId ? getActivePackageForFleet(user.fleetId).catch(() => null) : null,
    ]);
    return NextResponse.json({ user, configured: true, rank, planTitle: activePackage?.title ?? null });
  } catch (error) {
    routeError("failed", error, { durationMs: Date.now() - startedAt });
    return NextResponse.json(
      { user: null, configured: true, error: "Could not load account." },
      { status: 500 },
    );
  }
}
