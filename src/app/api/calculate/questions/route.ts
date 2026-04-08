import { NextRequest, NextResponse } from "next/server";
import { generateCalculationQuiz } from "@/lib/calculate-generator";
import type { CalculationQuizResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("mode");
    const difficulty = searchParams.get("difficulty");
    const questionCountParam = searchParams.get("count");

    if (!mode || (mode !== "learn" && mode !== "real")) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'learn' or 'real'." },
        { status: 400 },
      );
    }

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
        { status: 400 },
      );
    }

    const questionCount = questionCountParam
      ? parseInt(questionCountParam, 10)
      : 10;

    if (Number.isNaN(questionCount) || questionCount < 1 || questionCount > 50) {
      return NextResponse.json(
        { error: "Invalid question count. Must be between 1 and 50." },
        { status: 400 },
      );
    }

    const questions = generateCalculationQuiz(
      questionCount,
      difficulty as "easy" | "medium" | "hard" | "mixed",
    );

    const timeLimit =
      mode === "real" ? Math.floor((questionCount / 10) * 300) : undefined;

    const response: CalculationQuizResponse = {
      questions,
      mode: mode as "learn" | "real",
      timeLimit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating calculation questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions. Please try again." },
      { status: 500 },
    );
  }
}
