import { NextResponse } from "next/server";
import { generatePassageRecallQuiz } from "@/lib/passage-recall-generator";

export async function GET() {
  try {
    return NextResponse.json(generatePassageRecallQuiz());
  } catch (error) {
    console.error("Error generating passage recall quiz:", error);
    return NextResponse.json(
      { error: "Failed to generate passage recall quiz. Please try again." },
      { status: 500 },
    );
  }
}
