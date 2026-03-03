import { NextResponse } from "next/server";
import { topicSlugs } from "@/lib/topics";
import type { SubmitPayload, SubmitResult } from "@/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ topic: string }> }
) {
  const { topic } = await params;

  if (!topicSlugs.has(topic)) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const body: SubmitPayload = await req.json();

  if (!body.questionId || body.answer === undefined) {
    return NextResponse.json(
      { error: "Missing questionId or answer" },
      { status: 400 }
    );
  }

  // TODO: replace with real answer validation logic
  const result: SubmitResult = {
    correct: true,
    explanation: "Stub response — real logic coming soon.",
  };

  return NextResponse.json(result);
}
