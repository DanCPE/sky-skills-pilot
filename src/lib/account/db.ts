import { createHash, randomBytes } from "crypto";
import { Pool } from "pg";
import { topicSlugs, topics as quizTopics } from "../topics";
import { accountSkillDomains, getAccountSkillDomainForTopic } from "./topics";

const SESSION_COOKIE_NAME = "sky_session";
const SESSION_DURATION_DAYS = 30;
const MAX_PROFILES_PER_FLEET = 3;
const MAX_ACTIVE_SESSIONS_PER_FLEET = 4;

let accountPool: Pool | null = null;
let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

export interface AccountUser {
  id: string;
  fleetId: string;
  profileId: string;
  googleSub: string;
  email: string;
  name: string;
  imageUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountProfile {
  id: string;
  fleetId: string;
  callSign: string;
  imageUrl: string | null;
  isDefault: boolean;
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
  rank: number | null;
  rankedProfiles: number;
}

export interface AccountRankingSummary {
  actualPlatformRank: number | null;
  rankedProfiles: number;
  profilesAhead: number;
  dashboardAverage: number | null;
  totalAttempts: number;
}

export interface AccountOverview {
  user: AccountUser;
  profiles: AccountProfile[];
  scoreHistory: ScoreHistoryEntry[];
  radar: RadarPoint[];
  ranking: AccountRankingSummary;
  subscription: {
    status: string;
    provider: string | null;
    currentPeriodEnd: string | null;
  } | null;
}

export interface AccountSettingsOverview {
  user: AccountUser;
  profiles: AccountProfile[];
  subscription: {
    status: string;
    provider: string | null;
    currentPeriodEnd: string | null;
  } | null;
}

export type SubscriptionStatus =
  | "active"
  | "not_started"
  | "canceled"
  | "past_due"
  | "trialing";

export interface QuizAccessRule {
  topicSlug: string;
  isLocked: boolean;
  updatedAt: string;
}

export interface TopicAccessState {
  topicSlug: string;
  isLocked: boolean;
  isPaid: boolean;
  canAccess: boolean;
}

export interface AdminBillingFleet {
  fleetId: string;
  email: string;
  name: string;
  imageUrl: string | null;
  subscriptionStatus: string;
  provider: string | null;
  currentPeriodEnd: string | null;
  profileCount: number;
  activeSessionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAccountProfileSummary {
  id: string;
  callSign: string;
  imageUrl: string | null;
  isDefault: boolean;
  scoreCount: number;
  totalAttempts: number;
  dashboardAverage: number | null;
  dashboardRank: string;
  actualPlatformRank: number | null;
  latestScoreAt: string | null;
  createdAt: string;
  updatedAt: string;
  radar: RadarPoint[];
}

export interface AdminAccountFleetSummary {
  fleetId: string;
  email: string;
  name: string;
  imageUrl: string | null;
  emailVerified: boolean;
  profileCount: number;
  activeSessionCount: number;
  scoreCount: number;
  latestSessionAt: string | null;
  latestScoreAt: string | null;
  createdAt: string;
  updatedAt: string;
  profiles: AdminAccountProfileSummary[];
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

export function getSessionCookieExpiresAt() {
  return new Date(Date.now() + getSessionCookieMaxAge() * 1000);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: getSessionCookieMaxAge(),
    expires: getSessionCookieExpiresAt(),
    path: "/",
  };
}

export function getExpiredSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  };
}

export function createRawSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashSessionIp(ip: string) {
  const salt = process.env.ACCOUNT_IP_SALT || process.env.ANALYTICS_IP_SALT || "sky-skills";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function accountDebug(message: string, meta?: Record<string, unknown>) {
  console.log(`[account-debug] ${message}`, meta ?? {});
}

function accountError(
  message: string,
  error: unknown,
  meta?: Record<string, unknown>,
) {
  console.error(`[account-debug] ${message}`, {
    ...(meta ?? {}),
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
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
    const startedAt = Date.now();
    const pool = getPool();

    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

      await pool.query(`
        CREATE TABLE IF NOT EXISTS account_schema_migrations (
          id TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

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
        active_profile_id UUID,
        ip_hash TEXT,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

      await pool.query(`
      CREATE TABLE IF NOT EXISTS account_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES account_users(id) ON DELETE CASCADE,
        call_sign TEXT NOT NULL,
        image_url TEXT,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

      await pool.query(`
      CREATE TABLE IF NOT EXISTS account_score_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES account_users(id) ON DELETE CASCADE,
        profile_id UUID,
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

      await pool.query("ALTER TABLE account_sessions ADD COLUMN IF NOT EXISTS active_profile_id UUID;");
      await pool.query("ALTER TABLE account_sessions ADD COLUMN IF NOT EXISTS ip_hash TEXT;");
      await pool.query("ALTER TABLE account_score_history ADD COLUMN IF NOT EXISTS profile_id UUID;");

      const profileMigration = await pool.query(
        "SELECT 1 FROM account_schema_migrations WHERE id = $1 LIMIT 1;",
        ["fleet_profiles_v1"],
      );

      if (profileMigration.rowCount === 0) {
        await pool.query(`
      INSERT INTO account_profiles (user_id, call_sign, image_url, is_default)
      SELECT u.id, u.name, u.image_url, TRUE
      FROM account_users u
      WHERE NOT EXISTS (
        SELECT 1 FROM account_profiles p WHERE p.user_id = u.id
      );
    `);

        await pool.query(`
      UPDATE account_sessions s
      SET active_profile_id = p.id
      FROM account_profiles p
      WHERE s.user_id = p.user_id
        AND p.is_default = TRUE
        AND s.active_profile_id IS NULL;
    `);

        await pool.query(`
      UPDATE account_score_history h
      SET profile_id = p.id
      FROM account_profiles p
      WHERE h.user_id = p.user_id
        AND p.is_default = TRUE
        AND h.profile_id IS NULL;
    `);

        await pool.query(
          "INSERT INTO account_schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING;",
          ["fleet_profiles_v1"],
        );
      }

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

      await pool.query(`
      CREATE TABLE IF NOT EXISTS account_quiz_access (
        topic_slug TEXT PRIMARY KEY,
        is_locked BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

      const quizAccessMigration = await pool.query(
        "SELECT 1 FROM account_schema_migrations WHERE id = $1 LIMIT 1;",
        ["quiz_access_v1"],
      );

      if (quizAccessMigration.rowCount === 0) {
        for (const topic of quizTopics) {
          await pool.query(
            `
              INSERT INTO account_quiz_access (topic_slug, is_locked)
              VALUES ($1, $2)
              ON CONFLICT (topic_slug)
              DO UPDATE SET
                is_locked = EXCLUDED.is_locked,
                updated_at = NOW();
            `,
            [topic.slug, Boolean(topic.isLocked)],
          );
        }

        await pool.query(
          "INSERT INTO account_schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING;",
          ["quiz_access_v1"],
        );
      } else {
        for (const topic of quizTopics) {
          await pool.query(
            `
              INSERT INTO account_quiz_access (topic_slug, is_locked)
              VALUES ($1, $2)
              ON CONFLICT (topic_slug) DO NOTHING;
            `,
            [topic.slug, Boolean(topic.isLocked)],
          );
        }
      }

      await pool.query(
        "CREATE INDEX IF NOT EXISTS account_sessions_token_hash_idx ON account_sessions(token_hash);",
      );
      await pool.query(
        "CREATE INDEX IF NOT EXISTS account_sessions_expires_at_idx ON account_sessions(expires_at);",
      );
      await pool.query(
        "CREATE INDEX IF NOT EXISTS account_sessions_user_expires_idx ON account_sessions(user_id, expires_at);",
      );
      await pool.query(
        "CREATE INDEX IF NOT EXISTS account_profiles_user_idx ON account_profiles(user_id);",
      );
      await pool.query(
        "CREATE INDEX IF NOT EXISTS account_score_history_user_completed_idx ON account_score_history(user_id, completed_at DESC);",
      );
      await pool.query(
        "CREATE INDEX IF NOT EXISTS account_score_history_profile_completed_idx ON account_score_history(profile_id, completed_at DESC);",
      );
      await pool.query(
        "CREATE INDEX IF NOT EXISTS account_score_history_domain_idx ON account_score_history(skill_domain);",
      );
      await pool.query(
        "CREATE INDEX IF NOT EXISTS account_subscriptions_user_idx ON account_subscriptions(user_id);",
      );

      schemaReady = true;
      accountDebug("schema ready", { durationMs: Date.now() - startedAt });
    } catch (error) {
      schemaPromise = null;
      accountError("schema setup failed", error, {
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
  })();

  return schemaPromise;
}

function mapProfile(row: Record<string, unknown>): AccountProfile {
  return {
    id: String(row.id),
    fleetId: String(row.user_id),
    callSign: String(row.call_sign),
    imageUrl: row.image_url ? String(row.image_url) : null,
    isDefault: Boolean(row.is_default),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapUser(row: Record<string, unknown>): AccountUser {
  const profileId = String(row.profile_id ?? row.id);
  const fleetId = String(row.fleet_id ?? row.user_id ?? row.id);
  return {
    id: profileId,
    profileId,
    fleetId,
    googleSub: String(row.google_sub),
    email: String(row.email),
    name: String(row.call_sign ?? row.name),
    imageUrl: row.profile_image_url
      ? String(row.profile_image_url)
      : row.image_url
        ? String(row.image_url)
        : null,
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

function asRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapAdminProfile(row: Record<string, unknown>): AdminAccountProfileSummary {
  return {
    id: String(row.id),
    callSign: String(row.call_sign),
    imageUrl: row.image_url ? String(row.image_url) : null,
    isDefault: Boolean(row.is_default),
    scoreCount: Number(row.score_count ?? 0),
    totalAttempts: 0,
    dashboardAverage: null,
    dashboardRank: "Unranked",
    actualPlatformRank: null,
    latestScoreAt: row.latest_score_at
      ? new Date(String(row.latest_score_at)).toISOString()
      : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    radar: [],
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

  const userRow = result.rows[0];
  await pool.query(
    `
      INSERT INTO account_profiles (user_id, call_sign, image_url, is_default)
      SELECT $1, $2, $3, TRUE
      WHERE NOT EXISTS (
        SELECT 1 FROM account_profiles WHERE user_id = $1
      );
    `,
    [userRow.id, userRow.name, userRow.image_url],
  );

  return mapUser({
    ...userRow,
    profile_id: userRow.id,
    fleet_id: userRow.id,
    call_sign: userRow.name,
    profile_image_url: userRow.image_url,
  });
}

export async function getDefaultProfileForFleet(fleetId: string) {
  await ensureAccountSchema();
  const result = await getPool().query(
    `
      SELECT *
      FROM account_profiles
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at ASC
      LIMIT 1;
    `,
    [fleetId],
  );

  if (result.rowCount === 0) {
    throw new Error("No profile found for fleet.");
  }

  return mapProfile(result.rows[0]);
}

export async function createSession(input: {
  fleetId: string;
  profileId: string;
  rawToken: string;
  ipHash?: string;
}) {
  await ensureAccountSchema();
  const pool = getPool();
  const client = await pool.connect();
  const expiresAt = getSessionCookieExpiresAt().toISOString();
  const startedAt = Date.now();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM account_sessions WHERE expires_at <= NOW();");

    const insertResult = await client.query(
      `
        INSERT INTO account_sessions (
          user_id,
          active_profile_id,
          ip_hash,
          token_hash,
          expires_at
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `,
      [
        input.fleetId,
        input.profileId,
        input.ipHash ?? null,
        hashSessionToken(input.rawToken),
        expiresAt,
      ],
    );

    const insertedSessionId = String(insertResult.rows[0].id);
    const pruneResult = await client.query(
      `
        DELETE FROM account_sessions
        WHERE id IN (
          SELECT id
          FROM account_sessions
          WHERE user_id = $1
            AND expires_at > NOW()
            AND id <> $2
          ORDER BY created_at ASC
          OFFSET $3
        );
      `,
      [input.fleetId, insertedSessionId, MAX_ACTIVE_SESSIONS_PER_FLEET - 1],
    );

    await client.query("COMMIT");
    accountDebug("session created", {
      fleetId: input.fleetId,
      profileId: input.profileId,
      prunedOldSessions: pruneResult.rowCount,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    accountError("session create failed", error, {
      fleetId: input.fleetId,
      profileId: input.profileId,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteSession(rawToken: string) {
  if (!hasAccountDatabase()) return;
  await ensureAccountSchema();
  await getPool().query("DELETE FROM account_sessions WHERE token_hash = $1;", [
    hashSessionToken(rawToken),
  ]);
}

export async function deleteAccount(userId: string) {
  await ensureAccountSchema();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM account_payment_intents WHERE user_id = $1;", [
      userId,
    ]);
    await client.query("DELETE FROM account_users WHERE id = $1;", [userId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createAccountProfile(input: {
  fleetId: string;
  callSign: string;
  imageUrl?: string | null;
}) {
  await ensureAccountSchema();
  const pool = getPool();

  const countResult = await pool.query(
    "SELECT COUNT(*)::int AS count FROM account_profiles WHERE user_id = $1;",
    [input.fleetId],
  );

  if (Number(countResult.rows[0]?.count ?? 0) >= MAX_PROFILES_PER_FLEET) {
    throw new Error("A fleet can have a maximum of 3 accounts.");
  }

  const result = await pool.query(
    `
      INSERT INTO account_profiles (user_id, call_sign, image_url, is_default)
      VALUES ($1, $2, $3, FALSE)
      RETURNING *;
    `,
    [input.fleetId, input.callSign, input.imageUrl ?? null],
  );

  return mapProfile(result.rows[0]);
}

export async function deleteAccountProfile(input: {
  fleetId: string;
  profileId: string;
}) {
  await ensureAccountSchema();
  const pool = getPool();
  const client = await pool.connect();
  const startedAt = Date.now();

  try {
    await client.query("BEGIN");

    const profileResult = await client.query(
      `
        SELECT *
        FROM account_profiles
        WHERE id = $1
          AND user_id = $2
        LIMIT 1;
      `,
      [input.profileId, input.fleetId],
    );

    if (profileResult.rowCount === 0) {
      throw new Error("Account profile not found.");
    }

    if (Boolean(profileResult.rows[0].is_default)) {
      throw new Error("The default account cannot be deleted.");
    }

    const fallbackResult = await client.query(
      `
        SELECT id
        FROM account_profiles
        WHERE user_id = $1
          AND id <> $2
        ORDER BY is_default DESC, created_at ASC
        LIMIT 1;
      `,
      [input.fleetId, input.profileId],
    );

    if (fallbackResult.rowCount === 0) {
      throw new Error("A fleet must keep at least one account.");
    }

    const fallbackProfileId = String(fallbackResult.rows[0].id);

    const sessionResult = await client.query(
      `
        UPDATE account_sessions
        SET active_profile_id = $1
        WHERE user_id = $2
          AND active_profile_id = $3;
      `,
      [fallbackProfileId, input.fleetId, input.profileId],
    );

    const scoreResult = await client.query(
      "DELETE FROM account_score_history WHERE profile_id = $1 AND user_id = $2;",
      [input.profileId, input.fleetId],
    );

    const deleteResult = await client.query(
      `
        DELETE FROM account_profiles
        WHERE id = $1
          AND user_id = $2
          AND is_default = FALSE;
      `,
      [input.profileId, input.fleetId],
    );

    if (deleteResult.rowCount === 0) {
      throw new Error("Could not delete account profile.");
    }

    await client.query("COMMIT");
    accountDebug("profile deleted", {
      fleetId: input.fleetId,
      profileId: input.profileId,
      fallbackProfileId,
      sessionsMoved: sessionResult.rowCount,
      scoresDeleted: scoreResult.rowCount,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    accountError("profile delete failed", error, {
      fleetId: input.fleetId,
      profileId: input.profileId,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  } finally {
    client.release();
  }
}

export async function switchSessionProfile(input: {
  rawToken: string;
  fleetId: string;
  profileId: string;
}) {
  await ensureAccountSchema();
  const pool = getPool();
  const startedAt = Date.now();

  const profileResult = await pool.query(
    "SELECT id FROM account_profiles WHERE id = $1 AND user_id = $2 LIMIT 1;",
    [input.profileId, input.fleetId],
  );

  if (profileResult.rowCount === 0) {
    throw new Error("Profile not found in this fleet.");
  }

  const switchResult = await pool.query(
    `
      UPDATE account_sessions
      SET active_profile_id = $1
      WHERE token_hash = $2
        AND user_id = $3
        AND expires_at > NOW();
    `,
    [input.profileId, hashSessionToken(input.rawToken), input.fleetId],
  );

  if (switchResult.rowCount === 0) {
    throw new Error("Active session not found. Please sign in again.");
  }

  accountDebug("profile switched", {
    fleetId: input.fleetId,
    profileId: input.profileId,
    durationMs: Date.now() - startedAt,
  });
}

export async function updateAccountProfile(input: {
  profileId: string;
  name: string;
  imageUrl: string | null;
}) {
  await ensureAccountSchema();

  const result = await getPool().query(
    `
      UPDATE account_profiles
      SET call_sign = $2,
          image_url = $3,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `,
    [input.profileId, input.name, input.imageUrl],
  );

  if (result.rowCount === 0) {
    throw new Error("Account user not found.");
  }

  return mapProfile(result.rows[0]);
}

export async function getUserBySessionToken(rawToken: string | undefined) {
  if (!rawToken || !hasAccountDatabase()) return null;
  await ensureAccountSchema();
  const startedAt = Date.now();
  const result = await getPool().query(
    `
      SELECT
        u.id AS fleet_id,
        p.id AS profile_id,
        u.google_sub,
        u.email,
        p.call_sign,
        p.image_url AS profile_image_url,
        u.email_verified,
        p.created_at,
        p.updated_at
      FROM account_sessions s
      JOIN account_users u ON u.id = s.user_id
      LEFT JOIN account_profiles active_p
        ON active_p.id = s.active_profile_id
       AND active_p.user_id = u.id
      JOIN account_profiles p ON p.id = COALESCE(
        active_p.id,
        (
          SELECT p2.id
          FROM account_profiles p2
          WHERE p2.user_id = u.id
          ORDER BY p2.is_default DESC, p2.created_at ASC
          LIMIT 1
        )
      )
      WHERE s.token_hash = $1
        AND s.expires_at > NOW()
      LIMIT 1;
    `,
    [hashSessionToken(rawToken)],
  );

  accountDebug("session lookup", {
    found: (result.rowCount ?? 0) > 0,
    durationMs: Date.now() - startedAt,
  });

  if (result.rowCount === 0) return null;
  return mapUser(result.rows[0]);
}

function mapSubscription(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    status: String(row.status),
    provider: row.provider ? String(row.provider) : null,
    currentPeriodEnd: row.current_period_end
      ? new Date(String(row.current_period_end)).toISOString()
      : null,
  };
}

function isPaidSubscriptionStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

function mapQuizAccessRule(row: Record<string, unknown>): QuizAccessRule {
  return {
    topicSlug: String(row.topic_slug),
    isLocked: Boolean(row.is_locked),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function getAccountSettingsOverview(
  user: AccountUser,
): Promise<AccountSettingsOverview> {
  await ensureAccountSchema();
  const startedAt = Date.now();
  const result = await getPool().query(
    `
      WITH fleet_profiles AS (
        SELECT COALESCE(
          jsonb_agg(to_jsonb(p) ORDER BY p.is_default DESC, p.created_at ASC),
          '[]'::jsonb
        ) AS rows
        FROM account_profiles p
        WHERE p.user_id = $1
      ),
      latest_subscription AS (
        SELECT to_jsonb(s) AS row
        FROM account_subscriptions s
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC
        LIMIT 1
      )
      SELECT
        fleet_profiles.rows AS profiles,
        latest_subscription.row AS subscription
      FROM fleet_profiles
      LEFT JOIN latest_subscription ON TRUE;
    `,
    [user.fleetId],
  );

  const row = result.rows[0] ?? {};
  const profiles = asRows(row.profiles);
  const subscriptionRow = row.subscription as Record<string, unknown> | null;

  accountDebug("account settings overview loaded", {
    fleetId: user.fleetId,
    profileId: user.profileId,
    profiles: profiles.length,
    durationMs: Date.now() - startedAt,
  });

  return {
    user,
    profiles: profiles.map(mapProfile),
    subscription: mapSubscription(subscriptionRow),
  };
}

export async function getAccountOverview(profileId: string): Promise<AccountOverview> {
  await ensureAccountSchema();
  const pool = getPool();
  const startedAt = Date.now();
  const result = await pool.query(
    `
      WITH active_profile AS (
        SELECT
          p.*,
          u.id AS fleet_id,
          u.google_sub,
          u.email,
          u.email_verified
        FROM account_profiles p
        JOIN account_users u ON u.id = p.user_id
        WHERE p.id = $1
        LIMIT 1
      ),
      fleet_profiles AS (
        SELECT COALESCE(
          jsonb_agg(to_jsonb(p) ORDER BY p.is_default DESC, p.created_at ASC),
          '[]'::jsonb
        ) AS rows
        FROM account_profiles p
        JOIN active_profile ap ON ap.fleet_id = p.user_id
      ),
      recent_scores AS (
        SELECT COALESCE(
          jsonb_agg(to_jsonb(h) ORDER BY h.completed_at DESC),
          '[]'::jsonb
        ) AS rows
        FROM (
          SELECT *
          FROM account_score_history
          WHERE profile_id = $1
          ORDER BY completed_at DESC
          LIMIT 25
        ) h
      ),
      normalized_scores AS (
        SELECT
          profile_id,
          CASE
            WHEN topic_slug = 'dern-jood' THEN 'multitasking'
            WHEN skill_domain = 'aviation-recall' THEN 'short-term-memory'
            ELSE skill_domain
          END AS skill_domain,
          percentage
        FROM account_score_history
        WHERE profile_id IS NOT NULL
      ),
      domain_avgs AS (
        SELECT
          profile_id,
          skill_domain,
          AVG(percentage)::float AS value,
          COUNT(*)::int AS attempts
        FROM normalized_scores
        GROUP BY profile_id, skill_domain
      ),
      ranked_domains AS (
        SELECT
          profile_id,
          skill_domain,
          ROUND(value)::int AS value,
          attempts,
          RANK() OVER (
            PARTITION BY skill_domain
            ORDER BY value DESC, attempts DESC, profile_id ASC
          )::int AS domain_rank,
          COUNT(*) OVER (PARTITION BY skill_domain)::int AS ranked_profiles
        FROM domain_avgs
      ),
      active_radar AS (
        SELECT COALESCE(
          jsonb_agg(to_jsonb(rd) ORDER BY rd.skill_domain),
          '[]'::jsonb
        ) AS rows
        FROM ranked_domains rd
        WHERE rd.profile_id = $1
      ),
      profile_avgs AS (
        SELECT
          profile_id,
          ROUND(AVG(value))::int AS dashboard_average,
          SUM(attempts)::int AS total_attempts
        FROM domain_avgs
        GROUP BY profile_id
      ),
      ranked_profiles AS (
        SELECT
          profile_id,
          dashboard_average,
          total_attempts,
          RANK() OVER (
            ORDER BY dashboard_average DESC, total_attempts DESC, profile_id ASC
          )::int AS actual_platform_rank,
          COUNT(*) OVER ()::int AS ranked_profiles
        FROM profile_avgs
      ),
      active_rank AS (
        SELECT *
        FROM ranked_profiles
        WHERE profile_id = $1
      ),
      latest_subscription AS (
        SELECT to_jsonb(s) AS row
        FROM account_subscriptions s
        JOIN active_profile ap ON ap.fleet_id = s.user_id
        ORDER BY s.created_at DESC
        LIMIT 1
      )
      SELECT
        ap.*,
        fp.rows AS profiles,
        rs.rows AS score_history,
        ar.rows AS radar_rows,
        active_rank.actual_platform_rank,
        active_rank.ranked_profiles,
        active_rank.dashboard_average,
        active_rank.total_attempts,
        latest_subscription.row AS subscription
      FROM active_profile ap
      CROSS JOIN fleet_profiles fp
      CROSS JOIN recent_scores rs
      CROSS JOIN active_radar ar
      LEFT JOIN active_rank ON active_rank.profile_id = ap.id
      LEFT JOIN latest_subscription ON TRUE;
    `,
    [profileId],
  );

  if (result.rowCount === 0) {
    throw new Error("Account profile not found.");
  }

  const activeProfile = result.rows[0];
  const profiles = asRows(activeProfile.profiles);
  const scoreHistory = asRows(activeProfile.score_history);
  const radarRows = asRows(activeProfile.radar_rows);
  const radarByDomain = new Map(
    radarRows.map((row) => [
      String(row.skill_domain),
      {
        value: Math.round(Number(row.value)),
        attempts: Number(row.attempts),
        rank: Number(row.domain_rank),
        rankedProfiles: Number(row.ranked_profiles),
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
      rank: point?.rank ?? null,
      rankedProfiles: point?.rankedProfiles ?? 0,
    };
  });

  const subscriptionRow = activeProfile.subscription as
    | Record<string, unknown>
    | null;
  const actualPlatformRank = activeProfile.actual_platform_rank
    ? Number(activeProfile.actual_platform_rank)
    : null;
  const rankedProfiles = activeProfile.ranked_profiles
    ? Number(activeProfile.ranked_profiles)
    : 0;

  accountDebug("account overview loaded", {
    profileId,
    durationMs: Date.now() - startedAt,
    profiles: profiles.length,
    scores: scoreHistory.length,
    rankedProfiles,
  });

  return {
    user: mapUser({
      ...activeProfile,
      profile_id: activeProfile.id,
      profile_image_url: activeProfile.image_url,
    }),
    profiles: profiles.map(mapProfile),
    scoreHistory: scoreHistory.map(mapScore),
    radar,
    ranking: {
      actualPlatformRank,
      rankedProfiles,
      profilesAhead: actualPlatformRank ? actualPlatformRank - 1 : 0,
      dashboardAverage: activeProfile.dashboard_average
        ? Number(activeProfile.dashboard_average)
        : null,
      totalAttempts: activeProfile.total_attempts
        ? Number(activeProfile.total_attempts)
        : 0,
    },
    subscription: mapSubscription(subscriptionRow),
  };
}

export async function getAdminAccountFleets(): Promise<
  AdminAccountFleetSummary[]
> {
  await ensureAccountSchema();
  const pool = getPool();

  const [fleetResult, profileResult, radarResult] = await Promise.all([
    pool.query(
      `
        SELECT
          u.id AS fleet_id,
          u.email,
          u.name,
          u.image_url,
          u.email_verified,
          u.created_at,
          u.updated_at,
          COUNT(DISTINCT p.id)::int AS profile_count,
          COUNT(DISTINCT s.id)::int AS active_session_count,
          COUNT(DISTINCT h.id)::int AS score_count,
          MAX(s.created_at) AS latest_session_at,
          MAX(h.completed_at) AS latest_score_at
        FROM account_users u
        LEFT JOIN account_profiles p
          ON p.user_id = u.id
        LEFT JOIN account_sessions s
          ON s.user_id = u.id
         AND s.expires_at > NOW()
        LEFT JOIN account_score_history h
          ON h.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC;
      `,
    ),
    pool.query(
      `
        SELECT
          p.*,
          COUNT(h.id)::int AS score_count,
          MAX(h.completed_at) AS latest_score_at
        FROM account_profiles p
        LEFT JOIN account_score_history h
          ON h.profile_id = p.id
        GROUP BY p.id
        ORDER BY p.is_default DESC, p.created_at ASC;
      `,
    ),
    pool.query(
      `
        SELECT
          profile_id,
          normalized_skill_domain AS skill_domain,
          AVG(percentage)::float AS value,
          COUNT(*)::int AS attempts
        FROM (
          SELECT
            profile_id,
            CASE
              WHEN topic_slug = 'dern-jood' THEN 'multitasking'
              WHEN skill_domain = 'aviation-recall' THEN 'short-term-memory'
              ELSE skill_domain
            END AS normalized_skill_domain,
            percentage
          FROM account_score_history
          WHERE profile_id IS NOT NULL
        ) normalized_scores
        GROUP BY profile_id, normalized_skill_domain;
      `,
    ),
  ]);

  const radarByProfile = new Map<string, Map<string, RadarPoint>>();
  for (const row of radarResult.rows) {
    const profileId = String(row.profile_id);
    const domainMap = radarByProfile.get(profileId) ?? new Map<string, RadarPoint>();
    const slug = String(row.skill_domain);
    const domain = accountSkillDomains.find((item) => item.slug === slug);
    domainMap.set(slug, {
      slug,
      label: domain?.label ?? slug,
      value: Math.round(Number(row.value)),
      attempts: Number(row.attempts),
      rank: null,
      rankedProfiles: 0,
    });
    radarByProfile.set(profileId, domainMap);
  }

  const profilesByFleet = new Map<string, AdminAccountProfileSummary[]>();
  for (const row of profileResult.rows) {
    const fleetId = String(row.user_id);
    const profiles = profilesByFleet.get(fleetId) ?? [];
    const profile = mapAdminProfile(row);
    const profileRadarMap = radarByProfile.get(profile.id) ?? new Map();
    const profileRadar = accountSkillDomains.map((domain) => {
      const point = profileRadarMap.get(domain.slug);
      return {
        slug: domain.slug,
        label: domain.label,
        value: point?.value ?? 0,
        attempts: point?.attempts ?? 0,
        rank: null,
        rankedProfiles: 0,
      };
    });
    const activeRadar = profileRadar.filter((point) => point.attempts > 0);
    const dashboardAverage =
      activeRadar.length > 0
        ? Math.round(
            activeRadar.reduce((total, point) => total + point.value, 0) /
              activeRadar.length,
          )
        : null;
    const totalAttempts = activeRadar.reduce(
      (total, point) => total + point.attempts,
      0,
    );

    profiles.push({
      ...profile,
      totalAttempts,
      dashboardAverage,
      radar: profileRadar,
    });
    profilesByFleet.set(fleetId, profiles);
  }

  return fleetResult.rows.map((row) => {
    const fleetId = String(row.fleet_id);
    return {
      fleetId,
      email: String(row.email),
      name: String(row.name),
      imageUrl: row.image_url ? String(row.image_url) : null,
      emailVerified: Boolean(row.email_verified),
      profileCount: Number(row.profile_count ?? 0),
      activeSessionCount: Number(row.active_session_count ?? 0),
      scoreCount: Number(row.score_count ?? 0),
      latestSessionAt: row.latest_session_at
        ? new Date(String(row.latest_session_at)).toISOString()
        : null,
      latestScoreAt: row.latest_score_at
        ? new Date(String(row.latest_score_at)).toISOString()
        : null,
      createdAt: new Date(String(row.created_at)).toISOString(),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
      profiles: profilesByFleet.get(fleetId) ?? [],
    };
  });
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
  const pool = getPool();

  if (input.maxScore <= 0) {
    throw new Error("maxScore must be greater than zero.");
  }

  const profileResult = await pool.query(
    "SELECT user_id FROM account_profiles WHERE id = $1 LIMIT 1;",
    [input.userId],
  );

  if (profileResult.rowCount === 0) {
    throw new Error("Account profile not found.");
  }

  const fleetId = String(profileResult.rows[0].user_id);

  const percentage = Math.max(
    0,
    Math.min(100, (input.score / input.maxScore) * 100),
  );

  const result = await pool.query(
    `
      INSERT INTO account_score_history (
        user_id,
        profile_id,
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `,
    [
      fleetId,
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

export async function isFleetPaid(fleetId: string) {
  if (!hasAccountDatabase()) return false;
  await ensureAccountSchema();

  const result = await getPool().query(
    `
      SELECT status, current_period_end
      FROM account_subscriptions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    [fleetId],
  );

  if (result.rowCount === 0) return false;

  const row = result.rows[0];
  if (!isPaidSubscriptionStatus(String(row.status))) return false;

  if (!row.current_period_end) return true;
  return new Date(String(row.current_period_end)).getTime() > Date.now();
}

export async function getQuizAccessRules(): Promise<QuizAccessRule[]> {
  if (!hasAccountDatabase()) {
    return quizTopics.map((topic) => ({
      topicSlug: topic.slug,
      isLocked: Boolean(topic.isLocked),
      updatedAt: new Date(0).toISOString(),
    }));
  }

  await ensureAccountSchema();
  const result = await getPool().query(
    `
      SELECT topic_slug, is_locked, updated_at
      FROM account_quiz_access
      ORDER BY topic_slug ASC;
    `,
  );

  const rulesBySlug = new Map(
    result.rows.map((row) => [String(row.topic_slug), mapQuizAccessRule(row)]),
  );

  return quizTopics.map((topic) => {
    const rule = rulesBySlug.get(topic.slug);
    return (
      rule ?? {
        topicSlug: topic.slug,
        isLocked: Boolean(topic.isLocked),
        updatedAt: new Date(0).toISOString(),
      }
    );
  });
}

export async function getTopicAccessState(
  topicSlug: string,
  user?: AccountUser | null,
): Promise<TopicAccessState> {
  if (!topicSlugs.has(topicSlug)) {
    throw new Error("Topic not found.");
  }

  const staticTopic = quizTopics.find((topic) => topic.slug === topicSlug);
  let isLocked = Boolean(staticTopic?.isLocked);

  if (hasAccountDatabase()) {
    await ensureAccountSchema();
    const result = await getPool().query(
      `
        SELECT is_locked
        FROM account_quiz_access
        WHERE topic_slug = $1
        LIMIT 1;
      `,
      [topicSlug],
    );

    if ((result.rowCount ?? 0) > 0) {
      isLocked = Boolean(result.rows[0].is_locked);
    }
  }

  const isPaid = user ? await isFleetPaid(user.fleetId) : false;

  return {
    topicSlug,
    isLocked,
    isPaid,
    canAccess: !isLocked || isPaid,
  };
}

export async function getTopicsWithAccess(user?: AccountUser | null) {
  const [rules, isPaid] = await Promise.all([
    getQuizAccessRules(),
    user ? isFleetPaid(user.fleetId) : Promise.resolve(false),
  ]);

  const rulesBySlug = new Map(rules.map((rule) => [rule.topicSlug, rule]));

  return {
    isPaid,
    topics: quizTopics.map((topic) => {
      const requiresPaid = Boolean(rulesBySlug.get(topic.slug)?.isLocked);
      return {
        ...topic,
        isLocked: requiresPaid && !isPaid,
        requiresPaid,
      };
    }),
  };
}

export async function setQuizAccessRule(input: {
  topicSlug: string;
  isLocked: boolean;
}) {
  if (!topicSlugs.has(input.topicSlug)) {
    throw new Error("Topic not found.");
  }

  await ensureAccountSchema();
  const result = await getPool().query(
    `
      INSERT INTO account_quiz_access (topic_slug, is_locked)
      VALUES ($1, $2)
      ON CONFLICT (topic_slug)
      DO UPDATE SET
        is_locked = EXCLUDED.is_locked,
        updated_at = NOW()
      RETURNING *;
    `,
    [input.topicSlug, input.isLocked],
  );

  return mapQuizAccessRule(result.rows[0]);
}

export async function setFleetManualSubscription(input: {
  fleetId?: string;
  email?: string;
  status: SubscriptionStatus;
}) {
  await ensureAccountSchema();

  if (!input.fleetId && !input.email) {
    throw new Error("fleetId or email is required.");
  }

  const userResult = await getPool().query(
    `
      SELECT id
      FROM account_users
      WHERE ($1::uuid IS NOT NULL AND id = $1::uuid)
         OR ($2::text IS NOT NULL AND lower(email) = lower($2::text))
      LIMIT 1;
    `,
    [input.fleetId ?? null, input.email ?? null],
  );

  if (userResult.rowCount === 0) {
    throw new Error("Registered email not found.");
  }

  const fleetId = String(userResult.rows[0].id);
  const result = await getPool().query(
    `
      INSERT INTO account_subscriptions (
        user_id,
        provider,
        status,
        current_period_end,
        updated_at
      )
      VALUES ($1, 'manual', $2, NULL, NOW())
      RETURNING *;
    `,
    [fleetId, input.status],
  );

  accountDebug("manual subscription updated", {
    fleetId,
    email: input.email,
    status: input.status,
  });

  return mapSubscription(result.rows[0]);
}

export async function getAdminBillingOverview() {
  await ensureAccountSchema();

  const [fleetResult, quizAccess] = await Promise.all([
    getPool().query(
      `
        SELECT
          u.id AS fleet_id,
          u.email,
          u.name,
          u.image_url,
          u.created_at,
          u.updated_at,
          COALESCE(s.status, 'not_started') AS subscription_status,
          s.provider,
          s.current_period_end,
          COUNT(DISTINCT p.id)::int AS profile_count,
          COUNT(DISTINCT sess.id)::int AS active_session_count
        FROM account_users u
        LEFT JOIN LATERAL (
          SELECT *
          FROM account_subscriptions sub
          WHERE sub.user_id = u.id
          ORDER BY sub.created_at DESC
          LIMIT 1
        ) s ON TRUE
        LEFT JOIN account_profiles p
          ON p.user_id = u.id
        LEFT JOIN account_sessions sess
          ON sess.user_id = u.id
         AND sess.expires_at > NOW()
        GROUP BY u.id, s.status, s.provider, s.current_period_end
        ORDER BY u.created_at DESC;
      `,
    ),
    getQuizAccessRules(),
  ]);

  const fleets: AdminBillingFleet[] = fleetResult.rows.map((row) => ({
    fleetId: String(row.fleet_id),
    email: String(row.email),
    name: String(row.name),
    imageUrl: row.image_url ? String(row.image_url) : null,
    subscriptionStatus: String(row.subscription_status),
    provider: row.provider ? String(row.provider) : null,
    currentPeriodEnd: row.current_period_end
      ? new Date(String(row.current_period_end)).toISOString()
      : null,
    profileCount: Number(row.profile_count ?? 0),
    activeSessionCount: Number(row.active_session_count ?? 0),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }));

  return {
    generatedAt: new Date().toISOString(),
    fleets,
    quizAccess,
  };
}
