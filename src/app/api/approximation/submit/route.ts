import { NextRequest, NextResponse } from "next/server";
import type {
  ApproximationSubmitPayload,
  ApproximationSubmitResult,
} from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: ApproximationSubmitPayload = await req.json();
    const { questionId, answer, mode, correctAnswer } = body;

    if (!questionId || answer === undefined || answer === null) {
      return NextResponse.json(
        { error: "Missing required fields: questionId and answer" },
        { status: 400 },
      );
    }

    if (!mode || (mode !== "learn" && mode !== "real")) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'learn' or 'real'." },
        { status: 400 },
      );
    }

    if (correctAnswer === undefined) {
      return NextResponse.json(
        { error: "Missing correctAnswer in request body." },
        { status: 400 },
      );
    }

    const isCorrect = answer === correctAnswer;

    const result: ApproximationSubmitResult = {
      correct: isCorrect,
      correctAnswer: isCorrect ? undefined : correctAnswer,
      explanation: isCorrect
        ? "Correct. Nice estimation."
        : `The closest answer is ${correctAnswer}.`,
      currentScore: isCorrect ? 100 : 0,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error submitting approximation answer:", error);
    return NextResponse.json(
      { error: "Failed to submit answer. Please try again." },
      { status: 500 },
    );
  }
}
