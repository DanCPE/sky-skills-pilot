import { NextRequest, NextResponse } from "next/server";
import {
  appendAnalyticsEvent,
  extractClientIp,
  getTopicSlugFromPathname,
} from "@/lib/usage-analytics";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const eventType = body?.eventType;
    const pathname = body?.pathname;

    if (
      (eventType !== "page_view" && eventType !== "quiz_start") ||
      typeof pathname !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid payload." },
        { status: 400 },
      );
    }

    const ip = extractClientIp(request);

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

    return NextResponse.json({
      success: true,
      eventId: event.id,
      topicSlug: event.topicSlug,
    });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json(
      { error: "Failed to track analytics event." },
      { status: 500 },
    );
  }
}
