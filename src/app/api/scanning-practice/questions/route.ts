import { NextRequest, NextResponse } from "next/server";
import { generateQuiz } from "@/lib/scanning-practice-generator";
import type { ScanningPracticeQuizResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("mode");
    const questionCountParam = searchParams.get("count");

    // Validate mode
    if (!mode || (mode !== "learning" && mode !== "practice")) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'learning' or 'practice'." },
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

    // Generate questions
    const questions = generateQuiz(questionCount);

    // Calculate time limit for practice mode
    // 3 seconds per question for pilot scanning tests
    const timeLimit = mode === "practice" ? questionCount * 3 : undefined;

    const response: ScanningPracticeQuizResponse = {
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
