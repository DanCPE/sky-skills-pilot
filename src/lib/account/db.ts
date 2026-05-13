import { createHash, randomBytes } from "crypto";
import { Pool } from "pg";
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
}

export interface AccountOverview {
  user: AccountUser;
  profiles: AccountProfile[];
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
  const expiresAt = getSessionCookieExpiresAt().toISOString();

  await pool.query("DELETE FROM account_sessions WHERE expires_at <= NOW();");
  const sessionCount = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM account_sessions
      WHERE user_id = $1
        AND expires_at > NOW();
    `,
    [input.fleetId],
  );

  if (Number(sessionCount.rows[0]?.count ?? 0) >= MAX_ACTIVE_SESSIONS_PER_FLEET) {
    throw new Error("Fleet session limit reached. Sign out on another device first.");
  }

  await pool.query(
    `
      INSERT INTO account_sessions (user_id, active_profile_id, ip_hash, token_hash, expires_at)
      VALUES ($1, $2, $3, $4, $5);
    `,
    [
      input.fleetId,
      input.profileId,
      input.ipHash ?? null,
      hashSessionToken(input.rawToken),
      expiresAt,
    ],
  );
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

  const countResult = await pool.query(
    "SELECT COUNT(*)::int AS count FROM account_profiles WHERE user_id = $1;",
    [input.fleetId],
  );

  if (Number(countResult.rows[0]?.count ?? 0) <= 1) {
    throw new Error("A fleet must keep at least one account.");
  }

  await pool.query(
    `
      DELETE FROM account_profiles
      WHERE id = $1
        AND user_id = $2
        AND is_default = FALSE;
    `,
    [input.profileId, input.fleetId],
  );
}

export async function switchSessionProfile(input: {
  rawToken: string;
  fleetId: string;
  profileId: string;
}) {
  await ensureAccountSchema();
  const pool = getPool();

  const profileResult = await pool.query(
    "SELECT id FROM account_profiles WHERE id = $1 AND user_id = $2 LIMIT 1;",
    [input.profileId, input.fleetId],
  );

  if (profileResult.rowCount === 0) {
    throw new Error("Profile not found in this fleet.");
  }

  await pool.query(
    `
      UPDATE account_sessions
      SET active_profile_id = $1
      WHERE token_hash = $2
        AND user_id = $3
        AND expires_at > NOW();
    `,
    [input.profileId, hashSessionToken(input.rawToken), input.fleetId],
  );
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
      JOIN account_profiles p ON p.id = COALESCE(
        s.active_profile_id,
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

  if (result.rowCount === 0) return null;
  return mapUser(result.rows[0]);
}

export async function getAccountOverview(profileId: string): Promise<AccountOverview> {
  await ensureAccountSchema();
  const pool = getPool();

  const profileResult = await pool.query(
    `
      SELECT
        p.*,
        u.id AS fleet_id,
        u.google_sub,
        u.email,
        u.email_verified
      FROM account_profiles p
      JOIN account_users u ON u.id = p.user_id
      WHERE p.id = $1
      LIMIT 1;
    `,
    [profileId],
  );

  if (profileResult.rowCount === 0) {
    throw new Error("Account profile not found.");
  }

  const activeProfile = profileResult.rows[0];
  const fleetId = String(activeProfile.fleet_id);

  const [profilesResult, scoreResult, radarResult, subscriptionResult] =
    await Promise.all([
      pool.query(
        `
          SELECT *
          FROM account_profiles
          WHERE user_id = $1
          ORDER BY is_default DESC, created_at ASC;
        `,
        [fleetId],
      ),
      pool.query(
        `
          SELECT *
          FROM account_score_history
          WHERE profile_id = $1
          ORDER BY completed_at DESC
          LIMIT 25;
        `,
        [profileId],
      ),
      pool.query(
        `
          SELECT normalized_skill_domain AS skill_domain,
                 AVG(percentage)::float AS value,
                 COUNT(*)::int AS attempts
          FROM (
            SELECT
              CASE
                WHEN topic_slug = 'dern-jood' THEN 'multitasking'
                WHEN skill_domain = 'aviation-recall' THEN 'short-term-memory'
                ELSE skill_domain
              END AS normalized_skill_domain,
              percentage
            FROM account_score_history
            WHERE profile_id = $1
          ) normalized_scores
          GROUP BY normalized_skill_domain;
        `,
        [profileId],
      ),
      pool.query(
        `
          SELECT status, provider, current_period_end
          FROM account_subscriptions
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 1;
        `,
        [fleetId],
      ),
    ]);

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
    user: mapUser({
      ...activeProfile,
      profile_id: activeProfile.id,
      profile_image_url: activeProfile.image_url,
    }),
    profiles: profilesResult.rows.map(mapProfile),
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
