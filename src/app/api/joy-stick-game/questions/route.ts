import { NextRequest, NextResponse } from "next/server";
import { getTopicAccessDeniedResponse } from "@/lib/account/quiz-access";
import { generateJoyStickGameQuiz } from "@/lib/joy-stick-game-generator";
import type { JoyStickGameQuizResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const denied = await getTopicAccessDeniedResponse("joy-stick-game");
    if (denied) return denied;

    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("mode");
    const difficulty = searchParams.get("difficulty");
    const questionCountParam = searchParams.get("count");
    const bpmParam = searchParams.get("bpm");

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
        { error: "Invalid difficulty. Must be 'easy', 'medium', 'hard', or 'mixed'." },
        { status: 400 },
      );
    }

    const questionCount = questionCountParam
      ? parseInt(questionCountParam, 10)
      : 20;

    if (Number.isNaN(questionCount) || questionCount < 1 || questionCount > 50) {
      return NextResponse.json(
        { error: "Invalid question count. Must be between 1 and 50." },
        { status: 400 },
      );
    }

    const bpm = bpmParam ? parseInt(bpmParam, 10) : undefined;
    if (bpm !== undefined && (Number.isNaN(bpm) || bpm < 50 || bpm > 180)) {
      return NextResponse.json(
        { error: "Invalid BPM. Must be between 50 and 180." },
        { status: 400 },
      );
    }

    const response: JoyStickGameQuizResponse = {
      questions: generateJoyStickGameQuiz(
        questionCount,
        difficulty,
        mode,
        bpm,
      ),
      mode,
      bpm: mode === "learn" ? bpm : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating Joy-Stick Game questions:", error);
    return NextResponse.json(
      { error: "Failed to generate Joy-Stick Game questions. Please try again." },
      { status: 500 },
    );
  }
}
