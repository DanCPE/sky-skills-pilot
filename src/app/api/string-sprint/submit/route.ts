import { NextRequest, NextResponse } from "next/server";
import type {
  StringSprintSubmitPayload,
  StringSprintSubmitResult,
} from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: StringSprintSubmitPayload = await req.json();
    const { questionId, answer, mode, isSame } = body;

    // Validate required fields
    if (!questionId || answer === undefined || answer === null) {
      return NextResponse.json(
        { error: "Missing required fields: questionId and answer" },
        { status: 400 }
      );
    }

    if (!mode || (mode !== "learn" && mode !== "real")) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'learn' or 'real'." },
        { status: 400 }
      );
    }

    if (isSame === undefined) {
      return NextResponse.json(
        { error: "Missing isSame for validation." },
        { status: 400 }
      );
    }

    const normalizedAnswer = answer.toLowerCase();
    if (normalizedAnswer !== "same" && normalizedAnswer !== "different") {
      return NextResponse.json(
        { error: "Invalid answer format. Must be 'same' or 'different'." },
        { status: 400 }
      );
    }

    const correctAnswer = isSame ? "same" : "different";
    const isCorrect = normalizedAnswer === correctAnswer;

    // Calculate current score (100 points per correct answer)
    const currentScore = isCorrect ? 100 : 0;

    const result: StringSprintSubmitResult = {
      correct: isCorrect,
      correctAnswer: isCorrect ? undefined : correctAnswer,
      explanation: isCorrect
        ? "Correct! Nice snap judgement."
        : `The correct answer is ${correctAnswer}.`,
      currentScore,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json(
      { error: "Failed to submit answer. Please try again." },
      { status: 500 }
    );
  }
}
