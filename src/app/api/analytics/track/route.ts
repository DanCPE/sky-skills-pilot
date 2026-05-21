import { NextRequest, NextResponse } from "next/server";
import {
  appendAnalyticsEvent,
  extractClientIp,
  getTopicSlugFromPathname,
} from "@/lib/usage-analytics";

export const runtime = "nodejs";

function analyticsDebugLog(message: string, meta?: Record<string, unknown>) {
  if (process.env.ANALYTICS_DEBUG !== "true") return;

  if (meta) {
    console.log(`[analytics-track] ${message}`, meta);
  } else {
    console.log(`[analytics-track] ${message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    analyticsDebugLog("Incoming analytics track request", {
      eventType: body?.eventType,
      pathname: body?.pathname,
      topicSlug: body?.topicSlug,
      mode: body?.mode,
      difficulty: body?.difficulty,
      hasSessionId: typeof body?.sessionId === "string",
    });

    const eventType = body?.eventType;
    const pathname = body?.pathname;

    if (
      (eventType !== "page_view" && eventType !== "quiz_start") ||
      typeof pathname !== "string"
    ) {
      analyticsDebugLog("Rejected analytics track request: invalid payload");
      return NextResponse.json(
        { error: "Invalid payload." },
        { status: 400 },
      );
    }

    const ip = extractClientIp(request);
    analyticsDebugLog("Resolved client IP for analytics request", {
      ipMasked: ip.includes(".")
        ? `${ip.split(".")[0]}.${ip.split(".")[1]}.x.x`
        : "masked",
    });

    const event = await appendAnalyticsEvent({
      ip,
      eventType,
      pathname,
      topicSlug:
        typeof body?.topicSlug === "string"
          ? body.topicSlug
          : getTopicSlugFromPathname(pathname),
      mode: body?.mode === "learn" || body?.mode === "real" ? body.mode : undefined,
      difficulty:
        body?.difficulty === "easy" ||
        body?.difficulty === "medium" ||
        body?.difficulty === "hard" ||
        body?.difficulty === "mixed"
          ? body.difficulty
          : undefined,
      questionCount:
        typeof body?.questionCount === "number" ? body.questionCount : undefined,
      sessionId:
        typeof body?.sessionId === "string" ? body.sessionId : undefined,
      userAgent: request.headers.get("user-agent") ?? "",
    });
    analyticsDebugLog("Analytics request stored", {
      eventId: event.id,
      topicSlug: event.topicSlug,
    });

    return NextResponse.json({
      success: true,
      eventId: event.id,
      topicSlug: event.topicSlug,
    });
  } catch (error) {
    console.error("[analytics-track] error:", error);
    return NextResponse.json(
      { error: "Failed to track analytics event." },
      { status: 500 },
    );
  }
}
