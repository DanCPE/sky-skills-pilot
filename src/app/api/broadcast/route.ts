import { NextResponse } from "next/server";
import { readBroadcastSettings } from "@/lib/broadcast";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ broadcast: await readBroadcastSettings() });
  } catch (error) {
    console.error("[broadcast] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load broadcast phrase." },
      { status: 500 },
    );
  }
}
