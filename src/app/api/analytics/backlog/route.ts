import { NextRequest, NextResponse } from "next/server";
import { readAnalyticsEvents, summarizeAnalytics } from "@/lib/usage-analytics";

export const runtime = "nodejs";

function analyticsDebugLog(message: string, meta?: Record<string, unknown>) {
  if (process.env.ANALYTICS_DEBUG !== "true") return;

  if (meta) {
    console.log(`[analytics-backlog] ${message}`, meta);
  } else {
    console.log(`[analytics-backlog] ${message}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const topic = searchParams.get("topic") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    analyticsDebugLog("Incoming backlog request", {
      topic: topic ?? null,
      from: from ?? null,
      to: to ?? null,
    });

    const events = await readAnalyticsEvents();
    analyticsDebugLog("Events loaded for backlog", { count: events.length });
    const summary = summarizeAnalytics(events, {
      topic,
      fromIso: from,
      toIso: to,
    });
    analyticsDebugLog("Backlog summary built", {
      totalEvents: summary.totalEvents,
      uniqueUsersByIp: summary.uniqueUsersByIp,
      topicCount: summary.byTopic.length,
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
    console.error("[analytics-backlog] error:", error);
    return NextResponse.json(
      { error: "Failed to build analytics backlog summary." },
      { status: 500 },
    );
  }
}
