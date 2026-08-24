import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  completeRealTournamentAttempt,
  hasAccountDatabase,
  recordRealTournamentScore,
} from "@/lib/account/db";
import { verifyAnswerToken } from "@/lib/real-tournament/assemble";
import type {
  TournamentSubmitPayload,
  TournamentSubmitResult,
} from "@/lib/real-tournament/types";

function normalizeAnswer(answer: string | undefined) {
  return String(answer ?? "").trim();
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

  const body = (await request.json()) as TournamentSubmitPayload;

  if (!body.answerToken || !body.answers) {
    return NextResponse.json(
      { error: "answerToken and answers are required." },
      { status: 400 },
    );
  }

  const answerKey = verifyAnswerToken(body.answerToken);
  if (!answerKey) {
    return NextResponse.json(
      { error: "Tournament session is invalid or expired." },
      { status: 400 },
    );
  }

  if (answerKey.accountId !== user.fleetId) {
    return NextResponse.json(
      { error: "Tournament session does not belong to this account." },
      { status: 403 },
    );
  }

  const completedAttempt = await completeRealTournamentAttempt({
    attemptId: answerKey.attemptId,
    userId: user.fleetId,
    weekId: answerKey.weekId,
  });

  if (!completedAttempt) {
    return NextResponse.json(
      { error: "Tournament attempt was already submitted or is invalid." },
      { status: 409 },
    );
  }

  const results = answerKey.questions.map((question) => {
    const submittedAnswer = normalizeAnswer(body.answers?.[question.id]);
    const correctAnswer = normalizeAnswer(question.correctAnswer);

    return {
      id: question.id,
      sourceTopic: question.sourceTopic,
      roundId: question.roundId,
      difficulty: question.difficulty,
      correct: submittedAnswer === correctAnswer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  });

  const correctCount = results.filter((result) => result.correct).length;
  const questionCount = answerKey.questions.length;
  const score = correctCount;
  const maxScore = questionCount;
  const percentage =
    questionCount > 0 ? Math.round((correctCount / questionCount) * 10000) / 100 : 0;

  let saved = false;
  let rankingPosition: number | null = null;

  rankingPosition = await recordRealTournamentScore({
    profileId: user.profileId,
    weekId: answerKey.weekId,
    score,
    maxScore,
    correctCount,
    questionCount,
    timeTakenSeconds: body.timeTakenSeconds,
    metadata: {
      generatedAt: answerKey.generatedAt,
      expiresAt: answerKey.expiresAt,
      attemptId: answerKey.attemptId,
      roundTimes: body.roundTimes ?? {},
    },
  });
  saved = true;

  const response: TournamentSubmitResult = {
    score,
    maxScore,
    percentage,
    correctCount,
    questionCount,
    saved,
    rankingPosition,
    results,
  };

  return NextResponse.json(response);
}
