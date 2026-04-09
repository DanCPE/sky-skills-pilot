import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { Pool } from "pg";

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

let analyticsPool: Pool | null = null;
let dbInitialized = false;

function isAnalyticsDebugEnabled() {
  return process.env.ANALYTICS_DEBUG === "true";
}

function analyticsLog(message: string, meta?: Record<string, unknown>) {
  if (!isAnalyticsDebugEnabled()) return;

  if (meta) {
    console.log(`[analytics] ${message}`, meta);
  } else {
    console.log(`[analytics] ${message}`);
  }
}

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for DB analytics storage.");
  }

  if (!analyticsPool) {
    analyticsLog("Creating PostgreSQL connection pool");
    analyticsPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
  }

  return analyticsPool;
}

async function ensureAnalyticsTable() {
  if (!hasDatabaseUrl() || dbInitialized) {
    return;
  }

  const pool = getPool();
  analyticsLog("Ensuring analytics table and indexes");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      event_type TEXT NOT NULL,
      pathname TEXT NOT NULL,
      topic_slug TEXT,
      mode TEXT,
      difficulty TEXT,
      question_count INT,
      session_id TEXT,
      ip_hash TEXT NOT NULL,
      ip_label TEXT NOT NULL,
      user_agent TEXT NOT NULL
    );
  `);

  await pool.query(
    "CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events (created_at DESC);",
  );
  await pool.query(
    "CREATE INDEX IF NOT EXISTS analytics_events_topic_slug_idx ON analytics_events (topic_slug);",
  );
  await pool.query(
    "CREATE INDEX IF NOT EXISTS analytics_events_ip_hash_idx ON analytics_events (ip_hash);",
  );

  dbInitialized = true;
  analyticsLog("Analytics table/indexes are ready");
}

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

  if (hasDatabaseUrl()) {
    await ensureAnalyticsTable();
    const pool = getPool();
    analyticsLog("Writing analytics event to PostgreSQL", {
      eventId: enriched.id,
      eventType: enriched.eventType,
      pathname: enriched.pathname,
      topicSlug: enriched.topicSlug,
      mode: enriched.mode,
      difficulty: enriched.difficulty,
      hasSessionId: Boolean(enriched.sessionId),
    });
    await pool.query(
      `INSERT INTO analytics_events
        (id, created_at, event_type, pathname, topic_slug, mode, difficulty, question_count, session_id, ip_hash, ip_label, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        enriched.id,
        enriched.timestamp,
        enriched.eventType,
        enriched.pathname,
        enriched.topicSlug,
        enriched.mode ?? null,
        enriched.difficulty ?? null,
        enriched.questionCount ?? null,
        enriched.sessionId ?? null,
        enriched.ipHash,
        enriched.ipLabel,
        enriched.userAgent,
      ],
    );
    analyticsLog("Analytics event inserted");
    return enriched;
  }

  analyticsLog("DATABASE_URL missing, using local JSONL analytics fallback");
  await fs.mkdir(ANALYTICS_DIR, { recursive: true });
  await fs.appendFile(ANALYTICS_FILE, `${JSON.stringify(enriched)}\n`, "utf8");
  analyticsLog("Analytics event appended to JSONL fallback", {
    eventId: enriched.id,
  });
  return enriched;
}

async function readAnalyticsEventsFromFile(): Promise<AnalyticsEvent[]> {
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

export async function readAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  if (!hasDatabaseUrl()) {
    analyticsLog("Reading analytics events from local JSONL fallback");
    return readAnalyticsEventsFromFile();
  }

  await ensureAnalyticsTable();
  const pool = getPool();
  analyticsLog("Reading analytics events from PostgreSQL");
  const result = await pool.query<{
    id: string;
    created_at: Date;
    event_type: string;
    pathname: string;
    topic_slug: string | null;
    mode: string | null;
    difficulty: string | null;
    question_count: number | null;
    session_id: string | null;
    ip_hash: string;
    ip_label: string;
    user_agent: string;
  }>(
    `SELECT
      id,
      created_at,
      event_type,
      pathname,
      topic_slug,
      mode,
      difficulty,
      question_count,
      session_id,
      ip_hash,
      ip_label,
      user_agent
    FROM analytics_events
    ORDER BY created_at DESC`,
  );
  analyticsLog("Analytics events loaded from PostgreSQL", {
    rowCount: result.rowCount,
  });

  return result.rows.map((row) => ({
    id: row.id,
    timestamp: row.created_at.toISOString(),
    eventType: row.event_type as AnalyticsEventType,
    pathname: row.pathname,
    topicSlug: row.topic_slug,
    mode: (row.mode ?? undefined) as AnalyticsEvent["mode"],
    difficulty: (row.difficulty ?? undefined) as AnalyticsEvent["difficulty"],
    questionCount: row.question_count ?? undefined,
    sessionId: row.session_id ?? undefined,
    ipHash: row.ip_hash,
    ipLabel: row.ip_label,
    userAgent: row.user_agent,
  }));
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
