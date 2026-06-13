import { NextRequest, NextResponse } from "next/server";
import { getTopicAccessDeniedResponse } from "@/lib/account/quiz-access";
import { generateQuiz, type Difficulty } from "@/lib/string-sprint-generator";
import type { StringSprintQuizResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const denied = await getTopicAccessDeniedResponse("string-sprint");
    if (denied) return denied;

    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("mode");
    const difficulty = searchParams.get("difficulty") || "medium";
    const questionCountParam = searchParams.get("count");

    // Validate mode
    if (!mode || (mode !== "learn" && mode !== "real")) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'learn' or 'real'." },
        { status: 400 }
      );
    }

    // Parse question count (default: 40)
    const questionCount = questionCountParam
      ? parseInt(questionCountParam, 10)
      : 40;

    if (isNaN(questionCount) || questionCount < 1 || questionCount > 100) {
      return NextResponse.json(
        { error: "Invalid question count. Must be between 1 and 100." },
        { status: 400 }
      );
    }

    const allowedDifficulties = new Set(["easy", "medium", "hard", "mixed"]);
    if (!allowedDifficulties.has(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty. Must be easy, medium, hard, or mixed." },
        { status: 400 }
      );
    }

    // Generate questions
    const questions = generateQuiz(questionCount, difficulty as Difficulty);

    // String Sprint is deliberately tighter than the difference-count quiz.
    const timeLimit = mode === "real" ? questionCount * 2 : undefined;

    const response: StringSprintQuizResponse = {
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
