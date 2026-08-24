import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  getRealTournamentAttemptStatus,
  getRealTournamentRanking,
  hasAccountDatabase,
} from "@/lib/account/db";
import {
  getRealTournamentWeekTiming,
  REAL_TOURNAMENT_MAX_ATTEMPTS_PER_WEEK,
} from "@/lib/real-tournament/config";

export async function GET() {
  try {
    const weekTiming = getRealTournamentWeekTiming();
    const [ranking, user] = await Promise.all([
      getRealTournamentRanking({ weekId: weekTiming.weekId, limit: 30 }),
      getCurrentAccountUser(),
    ]);
    const attemptStatus =
      hasAccountDatabase() && user
        ? await getRealTournamentAttemptStatus({
            userId: user.fleetId,
            weekId: weekTiming.weekId,
            maxAttempts: REAL_TOURNAMENT_MAX_ATTEMPTS_PER_WEEK,
          })
        : null;

    return NextResponse.json({
      ranking,
      weekId: weekTiming.weekId,
      weekEndMs: weekTiming.weekEndMs,
      attemptStatus,
      signInRequired: !user,
    });
  } catch (error) {
    console.error("[real-tournament] Failed to load ranking", error);
    return NextResponse.json({ ranking: [] });
  }
}
