import { NextRequest, NextResponse } from "next/server";
import type { NumberSeriesSubmitPayload, NumberSeriesSubmitResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: NumberSeriesSubmitPayload = await req.json();
    const { questionId, answer, mode } = body;

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

    // Parse user answer
    const userAnswer = parseInt(answer, 10);
    if (isNaN(userAnswer)) {
      return NextResponse.json(
        { error: "Invalid answer format. Must be a number." },
        { status: 400 }
      );
    }

    // Extract correct answer from question ID format: ns_{timestamp}_{random}
    // We need to parse the original question data or validate against stored data
    // For this implementation, we'll decode the correct answer from the question data
    // In a production app, you'd fetch the question from a database/cache

    // For now, we'll parse the question ID which contains pattern info
    // The correct answer should be passed in the question data, not the ID
    // So we need to modify the submit endpoint to accept the full question data
    // OR store questions in a session/cache

    // Simplified approach: In a real app, you'd have the question stored
    // For this demo, we'll expect the client to pass the correctAnswer in the body
    // This is NOT secure for production, but works for this standalone implementation

    const { correctAnswer } = body;
    if (correctAnswer === undefined) {
      return NextResponse.json(
        {
          error:
            "Missing correctAnswer. In production, this would be fetched from a database.",
        },
        { status: 400 }
      );
    }

    const isCorrect = userAnswer === correctAnswer;

    // Calculate current score (simplified: 100 points per correct answer)
    const currentScore = isCorrect ? 100 : 0;

    // Generate explanation based on the patternType if provided
    let patternExplanation = "";
    if (body.patternType) {
      patternExplanation = isCorrect
        ? "Correct! Well done."
        : `The correct answer is ${correctAnswer}.`;
    } else {
      patternExplanation = isCorrect
        ? "Correct! Well done."
        : `The correct answer is ${correctAnswer}.`;
    }

    const result: NumberSeriesSubmitResult = {
      correct: isCorrect,
      correctAnswer: isCorrect ? undefined : correctAnswer,
      patternExplanation,
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
