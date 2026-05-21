import { NextRequest, NextResponse } from "next/server";
import { generatePassageRecallQuiz } from "@/lib/passage-recall-generator";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const modeParam = searchParams.get("mode");
    const durationParam = searchParams.get("duration");

    const mode = modeParam === "learn" || modeParam === "real" ? modeParam : "real";
    const parsedDuration = durationParam ? Number.parseInt(durationParam, 10) : NaN;
    const readingDurationSeconds =
      mode === "real"
        ? 120
        : Number.isFinite(parsedDuration) && parsedDuration >= 60 && parsedDuration <= 300
          ? parsedDuration
          : 120;

    return NextResponse.json(
      generatePassageRecallQuiz({
        mode,
        readingDurationSeconds,
      }),
    );
  } catch (error) {
    console.error("Error generating passage recall quiz:", error);
    return NextResponse.json(
      { error: "Failed to generate passage recall quiz. Please try again." },
      { status: 500 },
    );
  }
}
