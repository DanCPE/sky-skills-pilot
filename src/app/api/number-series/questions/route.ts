import { NextRequest, NextResponse } from "next/server";
import { generateQuiz } from "@/lib/number-series-generator";
import type { NumberSeriesQuizResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("mode");
    const difficulty = searchParams.get("difficulty");
    const questionCountParam = searchParams.get("count");

    // Validate mode
    if (!mode || (mode !== "learning" && mode !== "practice")) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'learning' or 'practice'." },
        { status: 400 }
      );
    }

    // Validate difficulty
    if (
      !difficulty ||
      (difficulty !== "easy" &&
        difficulty !== "medium" &&
        difficulty !== "hard" &&
        difficulty !== "mixed")
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid difficulty. Must be 'easy', 'medium', 'hard', or 'mixed'.",
        },
        { status: 400 }
      );
    }

    // Parse question count
    const questionCount = questionCountParam ? parseInt(questionCountParam, 10) : 10;
    if (isNaN(questionCount) || questionCount < 1 || questionCount > 50) {
      return NextResponse.json(
        { error: "Invalid question count. Must be between 1 and 50." },
        { status: 400 }
      );
    }

    // Generate questions
    const questions = generateQuiz(
      questionCount,
      difficulty as "easy" | "medium" | "hard" | "mixed"
    );

    // Calculate time limit for practice mode (5 minutes for 10 questions, scaled proportionally)
    const timeLimit =
      mode === "practice" ? Math.floor((questionCount / 10) * 300) : undefined;

    const response: NumberSeriesQuizResponse = {
      questions,
      mode: mode as "learning" | "practice",
      timeLimit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions. Please try again." },
      { status: 500 }
    );
  }
}
