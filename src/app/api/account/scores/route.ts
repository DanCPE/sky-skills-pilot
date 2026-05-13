import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  getAccountOverview,
  hasAccountDatabase,
  recordScore,
} from "@/lib/account/db";
import { getTopicTitle } from "@/lib/account/topics";
import { topicSlugs } from "@/lib/topics";

interface RecordScorePayload {
  topicSlug?: string;
  topicTitle?: string;
  score?: number;
  maxScore?: number;
  mode?: string;
  difficulty?: string;
  questionCount?: number;
  timeTakenSeconds?: number;
  metadata?: Record<string, unknown>;
}

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
  return NextResponse.json({
    scoreHistory: overview.scoreHistory,
    radar: overview.radar,
  });
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

  const body = (await request.json()) as RecordScorePayload;

  if (!body.topicSlug || !topicSlugs.has(body.topicSlug)) {
    return NextResponse.json(
      { error: "A valid topicSlug is required." },
      { status: 400 },
    );
  }

  if (
    typeof body.score !== "number" ||
    typeof body.maxScore !== "number" ||
    Number.isNaN(body.score) ||
    Number.isNaN(body.maxScore) ||
    body.maxScore <= 0
  ) {
    return NextResponse.json(
      { error: "score and maxScore must be valid numbers." },
      { status: 400 },
    );
  }

  const entry = await recordScore({
    userId: user.profileId,
    topicSlug: body.topicSlug,
    topicTitle: body.topicTitle || getTopicTitle(body.topicSlug),
    score: body.score,
    maxScore: body.maxScore,
    mode: body.mode,
    difficulty: body.difficulty,
    questionCount: body.questionCount,
    timeTakenSeconds: body.timeTakenSeconds,
    metadata: body.metadata,
  });

  return NextResponse.json({ score: entry }, { status: 201 });
}
