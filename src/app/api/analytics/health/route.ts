import { NextResponse } from "next/server";
import { getAnalyticsStorageHealth } from "@/lib/usage-analytics";

export const runtime = "nodejs";

export async function GET() {
  try {
    const health = await getAnalyticsStorageHealth();
    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      ...health,
    });
  } catch (error) {
    console.error("[analytics-health] error:", error);
    return NextResponse.json(
      {
        ok: false,
        generatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
