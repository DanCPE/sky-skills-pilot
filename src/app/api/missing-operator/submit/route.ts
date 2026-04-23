import { NextRequest, NextResponse } from "next/server";
import type {
  MissingOperatorSubmitPayload,
  MissingOperatorSubmitResult,
} from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: MissingOperatorSubmitPayload = await req.json();
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

    if (!correctAnswer) {
      return NextResponse.json(
        { error: "Missing correctAnswer in request body." },
        { status: 400 },
      );
    }

    const isCorrect = answer === correctAnswer;

    const result: MissingOperatorSubmitResult = {
      correct: isCorrect,
      correctAnswer: isCorrect ? undefined : correctAnswer,
      explanation: isCorrect
        ? "Correct! Nice mental math."
        : `The correct answer is ${correctAnswer}.`,
      currentScore: isCorrect ? 100 : 0,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error submitting missing operator answer:", error);
    return NextResponse.json(
      { error: "Failed to submit answer. Please try again." },
      { status: 500 },
    );
  }
}
