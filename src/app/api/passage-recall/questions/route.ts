import { NextResponse } from "next/server";
import { generateShortTermMemoryQuiz } from "@/lib/short-term-memory-generator";

export async function GET() {
  try {
    return NextResponse.json(generateShortTermMemoryQuiz());
  } catch (error) {
    console.error("Error generating passage recall quiz:", error);
    return NextResponse.json(
      { error: "Failed to generate passage recall quiz. Please try again." },
      { status: 500 },
    );
  }
}
