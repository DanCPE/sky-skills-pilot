"use client";

export type ClientAnalyticsPayload = {
  eventType: "page_view" | "quiz_start";
  pathname: string;
  topicSlug?: string | null;
  mode?: "learn" | "real";
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  questionCount?: number;
  sessionId?: string;
};

const SESSION_KEY = "sky_skills_session_id";

function getSessionId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const created = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}

export async function trackClientEvent(payload: ClientAnalyticsPayload) {
  if (typeof window === "undefined") {
    return;
  }

  const body = JSON.stringify({
    ...payload,
    sessionId: payload.sessionId ?? getSessionId(),
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/track", blob);
      return;
    }

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch (error) {
    console.error("Analytics tracking error:", error);
  }
}
