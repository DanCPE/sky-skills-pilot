import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import { getTopicAccessDeniedResponse } from "@/lib/account/quiz-access";
import {
  createRealTournamentAttempt,
  hasAccountDatabase,
} from "@/lib/account/db";
import { assembleRealTournamentQuestions } from "@/lib/real-tournament/assemble";
import {
  getRealTournamentWeekTiming,
  REAL_TOURNAMENT_MAX_ATTEMPTS_PER_WEEK,
  REAL_TOURNAMENT_TOPIC,
} from "@/lib/real-tournament/config";
import type { TournamentQuizResponse } from "@/lib/real-tournament/types";

export async function GET() {
  const denied = await getTopicAccessDeniedResponse(REAL_TOURNAMENT_TOPIC.slug);
  if (denied) return denied;

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

  try {
    const weekTiming = getRealTournamentWeekTiming();
    const attempt = await createRealTournamentAttempt({
      profileId: user.profileId,
      weekId: weekTiming.weekId,
      maxAttempts: REAL_TOURNAMENT_MAX_ATTEMPTS_PER_WEEK,
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "No tournament tokens remaining this week." },
        { status: 403 },
      );
    }

    const { tournamentWeekId, rounds, answerToken } =
      await assembleRealTournamentQuestions({
        accountId: attempt.accountId,
        attemptId: attempt.attemptId,
      });
    const response: TournamentQuizResponse = {
      tournamentWeekId,
      rounds,
      answerToken,
      mode: "real",
      difficulty: "mixed",
    };

    return NextResponse.json({
      ...response,
      remainingAttempts: attempt.remainingAttempts,
    });
  } catch (error) {
    console.error("[real-tournament] Failed to assemble questions", error);
    return NextResponse.json(
      { error: "Real Tournament is unavailable right now." },
      { status: 503 },
    );
  }
}
