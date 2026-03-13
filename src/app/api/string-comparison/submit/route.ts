import { NextRequest, NextResponse } from "next/server";
import type { ScanningPracticeSubmitPayload, ScanningPracticeSubmitResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: ScanningPracticeSubmitPayload = await req.json();
    const { questionId, answer, mode, differenceCount } = body;

    // Validate required fields
    if (!questionId || answer === undefined || answer === null) {
      return NextResponse.json(
        { error: "Missing required fields: questionId and answer" },
        { status: 400 }
      );
    }

    if (!mode || (mode !== "learning" && mode !== "practice")) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'learning' or 'practice'." },
        { status: 400 }
      );
    }

    if (differenceCount === undefined) {
      return NextResponse.json(
        { error: "Missing differenceCount for validation." },
        { status: 400 }
      );
    }

    // Parse user answer
    const userAnswer = parseInt(answer, 10);
    if (isNaN(userAnswer) || userAnswer < 0 || userAnswer > 5) {
      return NextResponse.json(
        { error: "Invalid answer format. Must be a number between 0-5." },
        { status: 400 }
      );
    }

    // Check if answer is correct
    const isCorrect = userAnswer === differenceCount;

    // Calculate current score (100 points per correct answer)
    const currentScore = isCorrect ? 100 : 0;

    const result: ScanningPracticeSubmitResult = {
      correct: isCorrect,
      correctAnswer: isCorrect ? undefined : differenceCount,
      explanation: isCorrect
        ? "Correct! Well done."
        : `The correct answer is ${differenceCount}.`,
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
