import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";
import type { NextRequest } from "next/server";

export type AnalyticsEventType = "page_view" | "quiz_start";

export interface AnalyticsEvent {
  id: string;
  timestamp: string;
  eventType: AnalyticsEventType;
  pathname: string;
  topicSlug: string | null;
  mode?: "learn" | "real";
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  questionCount?: number;
  sessionId?: string;
  ipHash: string;
  ipLabel: string;
  userAgent: string;
}

const ANALYTICS_DIR = path.join(process.cwd(), "analytics-data");
const ANALYTICS_FILE = path.join(ANALYTICS_DIR, "usage-events.jsonl");

function normalizeIp(ip: string): string {
  if (!ip) return "unknown";

  const normalized = ip.trim();
  if (normalized === "::1") return "127.0.0.1";
  if (normalized.startsWith("::ffff:")) {
    return normalized.replace("::ffff:", "");
  }

  return normalized;
}

export function extractClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return normalizeIp(first);
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return normalizeIp(realIp);
  }

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return normalizeIp(cfIp);
  }

  return "unknown";
}

function getIpHash(ip: string): string {
  const salt = process.env.ANALYTICS_IP_SALT || "sky-skills-ip-salt";
  return createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 24);
}

function getIpLabel(ip: string): string {
  if (ip === "unknown") return "unknown";

  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.x.x`;
    }
  }

  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}:*`;
    }
  }

  return "masked";
}

export function getTopicSlugFromPathname(pathname: string): string | null {
  if (!pathname.startsWith("/sky-quest/")) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const maybeTopic = segments[1];
  return maybeTopic ?? null;
}

export async function appendAnalyticsEvent(
  event: Omit<AnalyticsEvent, "id" | "timestamp" | "ipHash" | "ipLabel"> & {
    ip: string;
  },
): Promise<AnalyticsEvent> {
  const enriched: AnalyticsEvent = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    timestamp: new Date().toISOString(),
    eventType: event.eventType,
    pathname: event.pathname,
    topicSlug: event.topicSlug,
    mode: event.mode,
    difficulty: event.difficulty,
    questionCount: event.questionCount,
    sessionId: event.sessionId,
    ipHash: getIpHash(event.ip),
    ipLabel: getIpLabel(event.ip),
    userAgent: event.userAgent,
  };

  await fs.mkdir(ANALYTICS_DIR, { recursive: true });
  await fs.appendFile(ANALYTICS_FILE, `${JSON.stringify(enriched)}\n`, "utf8");

  return enriched;
}

export async function readAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  try {
    const content = await fs.readFile(ANALYTICS_FILE, "utf8");
    return content
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        try {
          return JSON.parse(line) as AnalyticsEvent;
        } catch {
          return null;
        }
      })
      .filter((event): event is AnalyticsEvent => event !== null);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function summarizeAnalytics(
  events: AnalyticsEvent[],
  options?: {
    topic?: string;
    fromIso?: string;
    toIso?: string;
  },
) {
  const fromMs = options?.fromIso ? Date.parse(options.fromIso) : null;
  const toMs = options?.toIso ? Date.parse(options.toIso) : null;

  const filtered = events.filter((event) => {
    const ts = Date.parse(event.timestamp);
    if (options?.topic && event.topicSlug !== options.topic) return false;
    if (fromMs !== null && ts < fromMs) return false;
    if (toMs !== null && ts > toMs) return false;
    return true;
  });

  const uniqueIpHashes = new Set(filtered.map((event) => event.ipHash));
  const uniqueSessions = new Set(
    filtered.map((event) => event.sessionId).filter(Boolean),
  );

  const byTopic = new Map<
    string,
    {
      events: number;
      uniqueUsers: Set<string>;
      uniqueSessions: Set<string>;
      pageViews: number;
      quizStarts: number;
    }
  >();

  for (const event of filtered) {
    const key = event.topicSlug ?? "unknown";

    if (!byTopic.has(key)) {
      byTopic.set(key, {
        events: 0,
        uniqueUsers: new Set<string>(),
        uniqueSessions: new Set<string>(),
        pageViews: 0,
        quizStarts: 0,
      });
    }

    const bucket = byTopic.get(key)!;
    bucket.events += 1;
    bucket.uniqueUsers.add(event.ipHash);

    if (event.sessionId) {
      bucket.uniqueSessions.add(event.sessionId);
    }

    if (event.eventType === "page_view") {
      bucket.pageViews += 1;
    }

    if (event.eventType === "quiz_start") {
      bucket.quizStarts += 1;
    }
  }

  return {
    totalEvents: filtered.length,
    uniqueUsersByIp: uniqueIpHashes.size,
    uniqueSessions: uniqueSessions.size,
    byTopic: Array.from(byTopic.entries()).map(([topic, data]) => ({
      topic,
      events: data.events,
      pageViews: data.pageViews,
      quizStarts: data.quizStarts,
      uniqueUsersByIp: data.uniqueUsers.size,
      uniqueSessions: data.uniqueSessions.size,
    })),
  };
}
