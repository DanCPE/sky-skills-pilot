import { NextRequest, NextResponse } from "next/server";
import type { CalculationSubmitPayload, CalculationSubmitResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: CalculationSubmitPayload = await req.json();
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

    const userAnswer = parseInt(answer, 10);
    if (Number.isNaN(userAnswer)) {
      return NextResponse.json(
        { error: "Invalid answer format. Must be a number." },
        { status: 400 },
      );
    }

    if (correctAnswer === undefined) {
      return NextResponse.json(
        { error: "Missing correctAnswer in request body." },
        { status: 400 },
      );
    }

    const isCorrect = userAnswer === correctAnswer;

    const result: CalculationSubmitResult = {
      correct: isCorrect,
      correctAnswer: isCorrect ? undefined : correctAnswer,
      explanation: isCorrect
        ? "Correct! Nice mental math."
        : `The correct answer is ${correctAnswer}.`,
      currentScore: isCorrect ? 100 : 0,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error submitting calculation answer:", error);
    return NextResponse.json(
      { error: "Failed to submit answer. Please try again." },
      { status: 500 },
    );
  }
}
