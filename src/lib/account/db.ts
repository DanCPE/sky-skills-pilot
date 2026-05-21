import { Pool } from "pg";
import { topicSlugs, topics as quizTopics } from "@/lib/topics";
import { accountSkillDomains } from "./topics";

let accountPool: Pool | null = null;
let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

export type SubscriptionStatus =
  | "active"
  | "not_started"
  | "canceled"
  | "past_due"
  | "trialing";

export interface RadarPoint {
  slug: string;
  label: string;
  value: number;
  attempts: number;
  rank: number | null;
  rankedProfiles: number;
}

export interface QuizAccessRule {
  topicSlug: string;
  isLocked: boolean;
  updatedAt: string;
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
      "Account admin features require DATABASE_URL, POSTGRES_URL, DB_URL, or SUPABASE_DB_URL.",
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

export async function ensureAccountSchema() {
  if (!hasAccountDatabase() || schemaReady) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const pool = getPool();
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_sub TEXT UNIQUE,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        image_url TEXT,
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
      CREATE TABLE IF NOT EXISTS account_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES account_users(id) ON DELETE CASCADE,
        active_profile_id UUID,
        ip_hash TEXT,
        token_hash TEXT UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

    await pool.query("ALTER TABLE account_users ALTER COLUMN google_sub DROP NOT NULL;");
    await pool.query("ALTER TABLE account_sessions ADD COLUMN IF NOT EXISTS active_profile_id UUID;");
    await pool.query("ALTER TABLE account_sessions ADD COLUMN IF NOT EXISTS ip_hash TEXT;");
    await pool.query("ALTER TABLE account_sessions ALTER COLUMN token_hash DROP NOT NULL;");
    await pool.query("ALTER TABLE account_score_history ADD COLUMN IF NOT EXISTS profile_id UUID;");

    await pool.query(
      "CREATE INDEX IF NOT EXISTS account_sessions_user_expires_idx ON account_sessions(user_id, expires_at);",
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS account_profiles_user_idx ON account_profiles(user_id);",
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS account_score_history_profile_completed_idx ON account_score_history(profile_id, completed_at DESC);",
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS account_subscriptions_user_idx ON account_subscriptions(user_id);",
    );

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

    schemaReady = true;
  })();

  return schemaPromise;
}

function mapQuizAccessRule(row: Record<string, unknown>): QuizAccessRule {
  return {
    topicSlug: String(row.topic_slug),
    isLocked: Boolean(row.is_locked),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
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

function isPaidSubscriptionStatus(status: string) {
  return status === "active" || status === "trialing";
}

function mapSubscription(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    status: String(row.status),
    provider: row.provider ? String(row.provider) : null,
    currentPeriodEnd: row.current_period_end
      ? new Date(String(row.current_period_end)).toISOString()
      : null,
  };
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

export { isPaidSubscriptionStatus };
