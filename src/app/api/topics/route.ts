import { NextResponse } from "next/server";
import { topics } from "@/lib/topics";

export async function GET() {
  return NextResponse.json(topics);
}
