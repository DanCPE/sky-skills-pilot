import { NextRequest, NextResponse } from "next/server";
import { readAnalyticsEvents, summarizeAnalytics } from "@/lib/usage-analytics";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const topic = searchParams.get("topic") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const events = await readAnalyticsEvents();
    const summary = summarizeAnalytics(events, {
      topic,
      fromIso: from,
      toIso: to,
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      filters: {
        topic: topic ?? null,
        from: from ?? null,
        to: to ?? null,
      },
      ...summary,
    });
  } catch (error) {
    console.error("Analytics backlog error:", error);
    return NextResponse.json(
      { error: "Failed to build analytics backlog summary." },
      { status: 500 },
    );
  }
}
