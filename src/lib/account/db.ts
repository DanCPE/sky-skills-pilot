import { createHash, randomBytes } from "crypto";
import { Pool } from "pg";
import { accountSkillDomains, getAccountSkillDomainForTopic } from "./topics";

const SESSION_COOKIE_NAME = "sky_session";
const SESSION_DURATION_DAYS = 30;

let accountPool: Pool | null = null;
let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

export interface AccountUser {
  id: string;
  googleSub: string;
  email: string;
  name: string;
  imageUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreHistoryEntry {
  id: string;
  topicSlug: string;
  topicTitle: string;
  skillDomain: string;
  score: number;
  maxScore: number;
  percentage: number;
  rankLabel: string;
  mode: string | null;
  difficulty: string | null;
  questionCount: number | null;
  timeTakenSeconds: number | null;
  completedAt: string;
}

export interface RadarPoint {
  slug: string;
  label: string;
  value: number;
  attempts: number;
}

export interface AccountOverview {
  user: AccountUser;
  scoreHistory: ScoreHistoryEntry[];
  radar: RadarPoint[];
  subscription: {
    status: string;
    provider: string | null;
    currentPeriodEnd: string | null;
  } | null;
}

interface GoogleProfile {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DB_URL ||
    process.env.SUPABASE_DB_URL ||
    null
  );
}

function getPool() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error(
      "Account features require DATABASE_URL, POSTGRES_URL, DB_URL, or SUPABASE_DB_URL.",
    );
  }

  if (!accountPool) {
    accountPool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });
  }

  return accountPool;
}

export function hasAccountDatabase() {
  return Boolean(getDatabaseUrl());
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieMaxAge() {
  return SESSION_DURATION_DAYS * 24 * 60 * 60;
}

export function createRawSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function rankScore(percentage: number) {
  if (percentage >= 90) return "Captain";
  if (percentage >= 75) return "First Officer";
  if (percentage >= 60) return "Cadet";
  if (percentage >= 40) return "Trainee";
  return "Ground School";
}

export async function ensureAccountSchema() {
  if (!hasAccountDatabase() || schemaReady) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const pool = getPool();

    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_sub TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        image_url TEXT,
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES account_users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_score_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES account_users(id) ON DELETE CASCADE,
        topic_slug TEXT NOT NULL,
        topic_title TEXT NOT NULL,
        skill_domain TEXT NOT NULL,
        score NUMERIC(8,2) NOT NULL,
        max_score NUMERIC(8,2) NOT NULL,
        percentage NUMERIC(5,2) NOT NULL,
        rank_label TEXT NOT NULL,
        mode TEXT,
        difficulty TEXT,
        question_count INT,
        time_taken_seconds INT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES account_users(id) ON DELETE CASCADE,
        provider TEXT,
        provider_customer_id TEXT,
        provider_subscription_id TEXT,
        status TEXT NOT NULL DEFAULT 'not_started',
        current_period_end TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_payment_intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES account_users(id) ON DELETE SET NULL,
        provider TEXT NOT NULL,
        provider_reference TEXT,
        status TEXT NOT NULL DEFAULT 'created',
        amount_cents INT,
        currency TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(
      "CREATE INDEX IF NOT EXISTS account_sessions_token_hash_idx ON account_sessions(token_hash);",
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS account_sessions_expires_at_idx ON account_sessions(expires_at);",
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS account_score_history_user_completed_idx ON account_score_history(user_id, completed_at DESC);",
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS account_score_history_domain_idx ON account_score_history(skill_domain);",
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS account_subscriptions_user_idx ON account_subscriptions(user_id);",
    );

    schemaReady = true;
  })();

  return schemaPromise;
}

function mapUser(row: Record<string, unknown>): AccountUser {
  return {
    id: String(row.id),
    googleSub: String(row.google_sub),
    email: String(row.email),
    name: String(row.name),
    imageUrl: row.image_url ? String(row.image_url) : null,
    emailVerified: Boolean(row.email_verified),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapScore(row: Record<string, unknown>): ScoreHistoryEntry {
  return {
    id: String(row.id),
    topicSlug: String(row.topic_slug),
    topicTitle: String(row.topic_title),
    skillDomain: String(row.skill_domain),
    score: Number(row.score),
    maxScore: Number(row.max_score),
    percentage: Number(row.percentage),
    rankLabel: String(row.rank_label),
    mode: row.mode ? String(row.mode) : null,
    difficulty: row.difficulty ? String(row.difficulty) : null,
    questionCount: row.question_count === null ? null : Number(row.question_count),
    timeTakenSeconds:
      row.time_taken_seconds === null ? null : Number(row.time_taken_seconds),
    completedAt: new Date(String(row.completed_at)).toISOString(),
  };
}

export async function upsertGoogleUser(profile: GoogleProfile) {
  await ensureAccountSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO account_users (google_sub, email, name, image_url, email_verified)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (google_sub)
      DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        image_url = EXCLUDED.image_url,
        email_verified = EXCLUDED.email_verified,
        updated_at = NOW()
      RETURNING *;
    `,
    [
      profile.sub,
      profile.email,
      profile.name || profile.email,
      profile.picture || null,
      Boolean(profile.email_verified),
    ],
  );

  return mapUser(result.rows[0]);
}

export async function createSession(userId: string, rawToken: string) {
  await ensureAccountSchema();
  const pool = getPool();
  const expiresAt = new Date(
    Date.now() + getSessionCookieMaxAge() * 1000,
  ).toISOString();

  await pool.query(
    `
      INSERT INTO account_sessions (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3);
    `,
    [userId, hashSessionToken(rawToken), expiresAt],
  );
}

export async function deleteSession(rawToken: string) {
  if (!hasAccountDatabase()) return;
  await ensureAccountSchema();
  await getPool().query("DELETE FROM account_sessions WHERE token_hash = $1;", [
    hashSessionToken(rawToken),
  ]);
}

export async function getUserBySessionToken(rawToken: string | undefined) {
  if (!rawToken || !hasAccountDatabase()) return null;
  await ensureAccountSchema();
  const result = await getPool().query(
    `
      SELECT u.*
      FROM account_sessions s
      JOIN account_users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > NOW()
      LIMIT 1;
    `,
    [hashSessionToken(rawToken)],
  );

  if (result.rowCount === 0) return null;
  return mapUser(result.rows[0]);
}

export async function getAccountOverview(userId: string): Promise<AccountOverview> {
  await ensureAccountSchema();
  const pool = getPool();

  const [userResult, scoreResult, radarResult, subscriptionResult] =
    await Promise.all([
      pool.query("SELECT * FROM account_users WHERE id = $1 LIMIT 1;", [userId]),
      pool.query(
        `
          SELECT *
          FROM account_score_history
          WHERE user_id = $1
          ORDER BY completed_at DESC
          LIMIT 25;
        `,
        [userId],
      ),
      pool.query(
        `
          SELECT skill_domain, AVG(percentage)::float AS value, COUNT(*)::int AS attempts
          FROM account_score_history
          WHERE user_id = $1
          GROUP BY skill_domain;
        `,
        [userId],
      ),
      pool.query(
        `
          SELECT status, provider, current_period_end
          FROM account_subscriptions
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 1;
        `,
        [userId],
      ),
    ]);

  if (userResult.rowCount === 0) {
    throw new Error("Account user not found.");
  }

  const radarByDomain = new Map(
    radarResult.rows.map((row) => [
      String(row.skill_domain),
      {
        value: Math.round(Number(row.value)),
        attempts: Number(row.attempts),
      },
    ]),
  );

  const radar = accountSkillDomains.map((domain) => {
    const point = radarByDomain.get(domain.slug);
    return {
      slug: domain.slug,
      label: domain.label,
      value: point?.value ?? 0,
      attempts: point?.attempts ?? 0,
    };
  });

  const subscriptionRow = subscriptionResult.rows[0];

  return {
    user: mapUser(userResult.rows[0]),
    scoreHistory: scoreResult.rows.map(mapScore),
    radar,
    subscription: subscriptionRow
      ? {
          status: String(subscriptionRow.status),
          provider: subscriptionRow.provider
            ? String(subscriptionRow.provider)
            : null,
          currentPeriodEnd: subscriptionRow.current_period_end
            ? new Date(String(subscriptionRow.current_period_end)).toISOString()
            : null,
        }
      : null,
  };
}

export async function recordScore(input: {
  userId: string;
  topicSlug: string;
  topicTitle: string;
  score: number;
  maxScore: number;
  mode?: string;
  difficulty?: string;
  questionCount?: number;
  timeTakenSeconds?: number;
  metadata?: Record<string, unknown>;
}) {
  await ensureAccountSchema();

  if (input.maxScore <= 0) {
    throw new Error("maxScore must be greater than zero.");
  }

  const percentage = Math.max(
    0,
    Math.min(100, (input.score / input.maxScore) * 100),
  );

  const result = await getPool().query(
    `
      INSERT INTO account_score_history (
        user_id,
        topic_slug,
        topic_title,
        skill_domain,
        score,
        max_score,
        percentage,
        rank_label,
        mode,
        difficulty,
        question_count,
        time_taken_seconds,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `,
    [
      input.userId,
      input.topicSlug,
      input.topicTitle,
      getAccountSkillDomainForTopic(input.topicSlug),
      input.score,
      input.maxScore,
      percentage,
      rankScore(percentage),
      input.mode ?? null,
      input.difficulty ?? null,
      input.questionCount ?? null,
      input.timeTakenSeconds ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );

  return mapScore(result.rows[0]);
}
