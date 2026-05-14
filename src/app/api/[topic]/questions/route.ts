import { NextResponse } from "next/server";
import { getTopicAccessDeniedResponse } from "@/lib/account/quiz-access";
import { topicSlugs } from "@/lib/topics";
import type { Question } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ topic: string }> }
) {
  const { topic } = await params;

  if (!topicSlugs.has(topic)) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const denied = await getTopicAccessDeniedResponse(topic);
  if (denied) return denied;

  // TODO: replace with DB / Python engine calls
  const questions: Question[] = [
    { id: "q1", prompt: `Sample question for ${topic} #1` },
    { id: "q2", prompt: `Sample question for ${topic} #2` },
  ];

  return NextResponse.json(questions);
}
