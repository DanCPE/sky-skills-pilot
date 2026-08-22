import { NextResponse } from "next/server";
import { getTopicAccessDeniedResponse } from "@/lib/account/quiz-access";
import { assembleRealTournamentQuestions } from "@/lib/real-tournament/assemble";
import { REAL_TOURNAMENT_TOPIC } from "@/lib/real-tournament/config";
import type { TournamentQuizResponse } from "@/lib/real-tournament/types";

export async function GET() {
  const denied = await getTopicAccessDeniedResponse(REAL_TOURNAMENT_TOPIC.slug);
  if (denied) return denied;

  try {
    const { tournamentWeekId, rounds, answerToken } =
      await assembleRealTournamentQuestions();
    const response: TournamentQuizResponse = {
      tournamentWeekId,
      rounds,
      answerToken,
      mode: "real",
      difficulty: "mixed",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[real-tournament] Failed to assemble questions", error);
    return NextResponse.json(
      { error: "Real Tournament is unavailable right now." },
      { status: 503 },
    );
  }
}
