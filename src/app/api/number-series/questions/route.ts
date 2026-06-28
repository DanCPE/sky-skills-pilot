import { NextRequest, NextResponse } from "next/server";
import { getTopicAccessDeniedResponse } from "@/lib/account/quiz-access";
import { generateQuiz } from "@/lib/number-series-generator";
import type { NumberSeriesQuizResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const denied = await getTopicAccessDeniedResponse("number-series");
    if (denied) return denied;

    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("mode");
    const difficulty = searchParams.get("difficulty");
    const questionCountParam = searchParams.get("count");

    // Validate mode
    if (!mode || (mode !== "learn" && mode !== "real")) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'learn' or 'real'." },
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

    const timeLimit =
      mode === "real" ? questionCount * 21 : undefined;

    const response: NumberSeriesQuizResponse = {
      questions,
      mode: mode as "learn" | "real",
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
