import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  getAdminAccountFleets,
  hasAccountDatabase,
  type AdminAccountFleetSummary,
  type AdminAccountProfileSummary,
} from "@/lib/account/db";

export const runtime = "nodejs";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function buildProfileLeaderboard(fleets: AdminAccountFleetSummary[]) {
  const rankedProfiles = fleets
    .flatMap((fleet) =>
      fleet.profiles.map((profile) => ({
        fleetId: fleet.fleetId,
        email: fleet.email,
        profileId: profile.id,
        callSign: profile.callSign,
        dashboardAverage: profile.dashboardAverage,
        totalAttempts: profile.totalAttempts,
        scoreCount: profile.scoreCount,
        latestScoreAt: profile.latestScoreAt,
      })),
    )
    .filter((profile) => profile.dashboardAverage !== null)
    .sort((a, b) => {
      const averageDelta =
        (b.dashboardAverage ?? 0) - (a.dashboardAverage ?? 0);
      if (averageDelta !== 0) return averageDelta;
      return b.totalAttempts - a.totalAttempts;
    });

  const rankByProfileId = new Map<string, number>();
  rankedProfiles.forEach((profile, index) => {
    rankByProfileId.set(profile.profileId, index + 1);
  });

  return {
    rankByProfileId,
    leaderboard: rankedProfiles.map((profile, index) => ({
      actualPlatformRank: index + 1,
      ...profile,
    })),
  };
}

function attachActualRanks(
  fleets: AdminAccountFleetSummary[],
  rankByProfileId: Map<string, number>,
) {
  return fleets.map((fleet) => ({
    ...fleet,
    profiles: fleet.profiles.map((profile): AdminAccountProfileSummary => {
      const actualPlatformRank = rankByProfileId.get(profile.id) ?? null;
      return {
        ...profile,
        actualPlatformRank,
      };
    }),
  }));
}

export async function GET() {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const adminEmails = getAdminEmails();
    const currentUser = await getCurrentAccountUser();

    if (adminEmails.length === 0 && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Admin access is not configured." },
        { status: 403 },
      );
    }

    if (
      adminEmails.length > 0 &&
      (!currentUser || !adminEmails.includes(currentUser.email.toLowerCase()))
    ) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: currentUser ? 403 : 401 },
      );
    }

    const rawFleets = await getAdminAccountFleets();
    const { rankByProfileId, leaderboard } = buildProfileLeaderboard(rawFleets);
    const fleets = attachActualRanks(rawFleets, rankByProfileId);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      notes: {
        dashboardRank:
          "The current dashboard Ranking card is an estimate, not a real leaderboard. It uses: Math.max(1, Math.round(500 - dashboardAverage * 4.65)). So a displayed 380th means the profile dashboard average is about 26%, and there are not necessarily 379 real users ahead of it.",
        actualPlatformRank:
          "actualPlatformRank in this API is computed from recorded profile scores only, sorted by dashboardAverage descending, then totalAttempts descending.",
      },
      totals: {
        fleets: fleets.length,
        profiles: fleets.reduce((total, fleet) => total + fleet.profileCount, 0),
        activeSessions: fleets.reduce(
          (total, fleet) => total + fleet.activeSessionCount,
          0,
        ),
        rankedProfiles: leaderboard.length,
      },
      leaderboard,
      fleets,
    });
  } catch (error) {
    console.error("[admin-accounts] failed to load accounts", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Failed to load account users." },
      { status: 500 },
    );
  }
}
