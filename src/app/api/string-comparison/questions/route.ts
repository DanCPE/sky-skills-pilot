import { NextRequest, NextResponse } from "next/server";
import { generateQuiz } from "@/lib/string-comparison-generator";
import type { ScanningPracticeQuizResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
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

    // Generate questions
    const questions = generateQuiz(questionCount, difficulty as any);

    // Calculate time limit for real mode
    // 3 seconds per question for pilot scanning tests
    const timeLimit = mode === "real" ? questionCount * 3 : undefined;

    const response: ScanningPracticeQuizResponse = {
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
