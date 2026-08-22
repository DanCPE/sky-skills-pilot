import { NextResponse } from "next/server";
import { getRealTournamentRanking } from "@/lib/account/db";

export async function GET() {
  try {
    const ranking = await getRealTournamentRanking(30);
    return NextResponse.json({ ranking });
  } catch (error) {
    console.error("[real-tournament] Failed to load ranking", error);
    return NextResponse.json({ ranking: [] });
  }
}
