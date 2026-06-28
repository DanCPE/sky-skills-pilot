import { createHash, randomBytes } from "crypto";
import { Pool } from "pg";
import { topicSlugs, topics as quizTopics } from "../topics";
import { accountSkillDomains, getAccountSkillDomainForTopic } from "./topics";

const SESSION_COOKIE_NAME = "sky_session";
const SESSION_DURATION_DAYS = 30;
const MAX_ACTIVE_SESSIONS_PER_FLEET = 4;
const DEFAULT_FLEET_MEMBER_LIMIT = 1;
const PACKAGE_FLEET_MEMBER_LIMITS: Record<string, number> = {
  "first-officer": 2,
  captain: 3,
  "captain-pro-max": 3,
};

let accountPool: Pool | null = null;
let schemaReady = false;
let schemaPromise: Promise<void> | null = null;
let quizAccessRulesCache:
  | { expiresAt: number; rules: QuizAccessRule[] }
  | null = null;
const subscriptionPackagesCache = new Map<
  string,
  { expiresAt: number; packages: SubscriptionPackage[] }
>();
let promotionCodesCache:
  | { expiresAt: number; promotions: PromotionCode[] }
  | null = null;

const CAPTAIN_PRO_MAX_PACKAGE_KEY = "captain-pro-max";

const CONFIG_CACHE_MS = 60 * 1000;

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
  maxProfiles: number;
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
  maxProfiles: number;
  subscription: {
    status: string;
    provider: string | null;
    currentPeriodEnd: string | null;
  } | null;
  latestPaymentSlip: ManualPaymentSlip | null;
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
  latestPackageKey: string | null;
  latestPackageTitle: string | null;
  latestPackageAmountThb: number | null;
  latestPackageDurationMonths: number | null;
  latestSlipId: string | null;
  latestSlip2goTransRef: string | null;
  latestPromotionCode: string | null;
  latestPersonalFilesSentAt: string | null;
  profileCount: number;
  activeSessionCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ManualPaymentStatus = "pending" | "approved" | "rejected";

export interface ManualPaymentConfig {
  bankName: string;
  accountName: string;
  accountNumber: string;
  promptPayId: string;
  paymentQrImageUrl: string;
  defaultAmountThb: number | null;
  currency: string;
}

export interface SubscriptionPackage {
  key: string;
  title: string;
  description: string;
  details: SubscriptionPackageDetail[];
  priceCents: number;
  priceThb: number;
  currency: string;
  durationMonths: number;
  imageUrl: string;
  qrImageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPackageDetail {
  label: string;
  subDetail?: string | null;
}

export type PromotionDiscountType = "percent" | "fixed";
export type PromotionCodeType = "shared" | "one_time";

export interface PromotionCode {
  code: string;
  promotionType: PromotionCodeType;
  packageKey: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxRedemptions: number | null;
  redeemedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppliedPromotion {
  promotion: PromotionCode;
  originalAmountCents: number;
  discountCents: number;
  finalAmountCents: number;
}

export interface ManualPaymentSlip {
  id: string;
  fleetId: string;
  profileId: string | null;
  email: string;
  callSign: string | null;
  planKey: string;
  planTitle: string | null;
  amountCents: number;
  amountThb: number;
  originalAmountCents: number | null;
  originalAmountThb: number | null;
  discountCents: number;
  discountThb: number;
  promotionCode: string | null;
  currency: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  promptPayId: string | null;
  transferReference: string | null;
  miniQrPayload: string | null;
  slip2goStatus: string | null;
  slip2goTransRef: string | null;
  slip2goAmountThb: number | null;
  slip2goPayload: Record<string, unknown>;
  verificationError: string | null;
  slipFileName: string;
  slipContentType: string;
  note: string | null;
  status: ManualPaymentStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  personalFilesSentAt: string | null;
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

async function canUseExistingAccountSchema(pool: Pool) {
  const result = await pool.query(
    `
      SELECT
        to_regclass('public.account_users') IS NOT NULL AS has_users,
        to_regclass('public.account_sessions') IS NOT NULL AS has_sessions,
        to_regclass('public.account_profiles') IS NOT NULL AS has_profiles,
        to_regclass('public.account_subscriptions') IS NOT NULL AS has_subscriptions,
        to_regclass('public.account_quiz_access') IS NOT NULL AS has_quiz_access,
        to_regclass('public.account_manual_payment_slips') IS NOT NULL AS has_payment_slips,
        to_regclass('public.account_subscription_packages') IS NOT NULL AS has_packages,
        to_regclass('public.account_billing_assets') IS NOT NULL AS has_billing_assets,
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'account_subscription_packages'
            AND column_name = 'duration_months'
        ) AS has_package_duration,
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'account_billing_assets'
            AND column_name = 'metadata'
        ) AS has_billing_asset_metadata,
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'account_manual_payment_slips'
            AND column_name = 'slip2go_trans_ref'
        ) AS has_slip2go_columns,
        to_regclass('public.account_manual_payment_slips_trans_ref_unique_idx') IS NOT NULL AS has_slip2go_unique_index;
    `,
  );
  const row = result.rows[0] ?? {};
  return Object.values(row).every(Boolean);
}

async function ensureBillingAssetMetadataColumn() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS account_billing_assets (
      key TEXT PRIMARY KEY,
      file_name TEXT,
      content_type TEXT,
      bytes BYTEA,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await getPool().query(
    "ALTER TABLE account_billing_assets ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;",
  );
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
      if (await canUseExistingAccountSchema(pool)) {
        schemaReady = true;
        accountDebug("schema ready from existing tables", {
          durationMs: Date.now() - startedAt,
        });
        return;
      }

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
      CREATE TABLE IF NOT EXISTS account_manual_payment_slips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES account_users(id) ON DELETE CASCADE,
        profile_id UUID REFERENCES account_profiles(id) ON DELETE SET NULL,
        plan_key TEXT NOT NULL DEFAULT 'full_access',
        amount_cents INT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'THB',
        bank_name TEXT NOT NULL,
        account_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        promptpay_id TEXT,
        transfer_reference TEXT,
        mini_qr_payload TEXT,
        slip2go_status TEXT,
        slip2go_trans_ref TEXT,
        slip2go_amount_cents INT,
        slip2go_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        verification_error TEXT,
        slip_file_name TEXT NOT NULL,
        slip_content_type TEXT NOT NULL,
        slip_bytes BYTEA NOT NULL,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        reviewed_at TIMESTAMPTZ,
        reviewed_by TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

      await pool.query("ALTER TABLE account_manual_payment_slips ADD COLUMN IF NOT EXISTS slip2go_status TEXT;");
      await pool.query("ALTER TABLE account_manual_payment_slips ADD COLUMN IF NOT EXISTS slip2go_trans_ref TEXT;");
      await pool.query("ALTER TABLE account_manual_payment_slips ADD COLUMN IF NOT EXISTS slip2go_amount_cents INT;");
      await pool.query("ALTER TABLE account_manual_payment_slips ADD COLUMN IF NOT EXISTS slip2go_payload JSONB NOT NULL DEFAULT '{}'::jsonb;");
      await pool.query("ALTER TABLE account_manual_payment_slips ADD COLUMN IF NOT EXISTS verification_error TEXT;");
      await pool.query("ALTER TABLE account_manual_payment_slips ADD COLUMN IF NOT EXISTS original_amount_cents INT;");
      await pool.query("ALTER TABLE account_manual_payment_slips ADD COLUMN IF NOT EXISTS discount_cents INT NOT NULL DEFAULT 0;");
      await pool.query("ALTER TABLE account_manual_payment_slips ADD COLUMN IF NOT EXISTS promotion_code TEXT;");
      await pool.query("ALTER TABLE account_manual_payment_slips ADD COLUMN IF NOT EXISTS personal_files_sent_at TIMESTAMPTZ;");

      await pool.query(`
      CREATE TABLE IF NOT EXISTS account_subscription_packages (
        key TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        details JSONB NOT NULL DEFAULT '[]'::jsonb,
        price_cents INT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'THB',
        duration_months INT NOT NULL DEFAULT 1,
        image_file_name TEXT,
        image_content_type TEXT,
        image_bytes BYTEA,
        qr_file_name TEXT,
        qr_content_type TEXT,
        qr_bytes BYTEA,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

      await pool.query("ALTER TABLE account_subscription_packages ADD COLUMN IF NOT EXISTS duration_months INT NOT NULL DEFAULT 1;");
      await pool.query("UPDATE account_subscription_packages SET duration_months = 6 WHERE key = 'first-officer' AND duration_months = 1;");
      await pool.query("UPDATE account_subscription_packages SET duration_months = 12 WHERE key = 'captain' AND duration_months = 1;");

      await pool.query(`
      CREATE TABLE IF NOT EXISTS account_billing_assets (
        key TEXT PRIMARY KEY,
        file_name TEXT,
        content_type TEXT,
        bytes BYTEA,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
      await pool.query("ALTER TABLE account_billing_assets ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;");

      await pool.query(`
      CREATE TABLE IF NOT EXISTS account_promotion_codes (
        code TEXT PRIMARY KEY,
        promotion_type TEXT NOT NULL DEFAULT 'shared',
        package_key TEXT NOT NULL REFERENCES account_subscription_packages(key) ON DELETE CASCADE,
        discount_type TEXT NOT NULL,
        discount_value INT NOT NULL,
        max_redemptions INT,
        redeemed_count INT NOT NULL DEFAULT 0,
        starts_at TIMESTAMPTZ,
        ends_at TIMESTAMPTZ,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (promotion_type IN ('shared', 'one_time')),
        CHECK (discount_type IN ('percent', 'fixed')),
        CHECK (discount_value > 0),
        CHECK (max_redemptions IS NULL OR max_redemptions > 0),
        CHECK (redeemed_count >= 0)
      );
    `);
      await pool.query("CREATE INDEX IF NOT EXISTS account_promotion_codes_package_idx ON account_promotion_codes(package_key, is_active);");

      const packageMigration = await pool.query(
        "SELECT 1 FROM account_schema_migrations WHERE id = $1 LIMIT 1;",
        ["subscription_packages_v1"],
      );

      if (packageMigration.rowCount === 0) {
        const defaultPackages = [
          {
            key: "cadet",
            title: "Cadet",
            description: "Start practicing with selected paid quizzes.",
            details: ["Paid quiz access", "Score history", "Skill dashboard"],
            priceCents: 19900,
            durationMonths: 1,
            sortOrder: 10,
          },
          {
            key: "first-officer",
            title: "First Officer",
            description: "Balanced package for regular aptitude preparation.",
            details: [
              "All paid quizzes",
              "Score history",
              "Skill dashboard",
              "Priority feature access",
            ],
            priceCents: 49900,
            durationMonths: 6,
            sortOrder: 20,
          },
          {
            key: "captain",
            title: "Captain",
            description: "Full preparation package for serious assessment runs.",
            details: [
              "All paid quizzes",
              "Score history",
              "Skill dashboard",
              "Future premium tools",
            ],
            priceCents: 99900,
            durationMonths: 12,
            sortOrder: 30,
          },
          {
            key: CAPTAIN_PRO_MAX_PACKAGE_KEY,
            title: "Captain Pro Max",
            description: "Captain access plus personal file support from the SkySkills team.",
            details: [
              "All paid quizzes",
              "Score history",
              "Skill dashboard",
              "Personal file delivery",
            ],
            priceCents: 202600,
            durationMonths: 12,
            sortOrder: 40,
          },
        ];

        for (const item of defaultPackages) {
          await pool.query(
            `
              INSERT INTO account_subscription_packages (
                key,
                title,
                description,
                details,
                price_cents,
                currency,
                duration_months,
                sort_order
              )
              VALUES ($1, $2, $3, $4, $5, 'THB', $6, $7)
              ON CONFLICT (key) DO NOTHING;
            `,
            [
              item.key,
              item.title,
              item.description,
              JSON.stringify(item.details),
              item.priceCents,
              item.durationMonths,
              item.sortOrder,
            ],
          );
        }

        await pool.query(
          "INSERT INTO account_schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING;",
          ["subscription_packages_v1"],
        );
      }

      await pool.query(
        `
          INSERT INTO account_subscription_packages (
            key,
            title,
            description,
            details,
            price_cents,
            currency,
            duration_months,
            sort_order
          )
          VALUES (
            $1,
            'Captain Pro Max',
            'Captain access plus personal file support from the SkySkills team.',
            $2,
            202600,
            'THB',
            12,
            40
          )
          ON CONFLICT (key) DO NOTHING;
        `,
        [
          CAPTAIN_PRO_MAX_PACKAGE_KEY,
          JSON.stringify([
            "All paid quizzes",
            "Score history",
            "Skill dashboard",
            "Personal file delivery",
          ]),
        ],
      );

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
      await pool.query(
        "CREATE INDEX IF NOT EXISTS account_manual_payment_slips_user_created_idx ON account_manual_payment_slips(user_id, created_at DESC);",
      );
      await pool.query(
        "CREATE INDEX IF NOT EXISTS account_manual_payment_slips_status_created_idx ON account_manual_payment_slips(status, created_at DESC);",
      );
      await pool.query(
        "CREATE UNIQUE INDEX IF NOT EXISTS account_manual_payment_slips_trans_ref_unique_idx ON account_manual_payment_slips(slip2go_trans_ref) WHERE slip2go_trans_ref IS NOT NULL;",
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
  const maxProfiles = await getFleetProfileLimit(input.fleetId);

  if (Number(countResult.rows[0]?.count ?? 0) >= maxProfiles) {
    throw new Error(
      `This fleet can have a maximum of ${maxProfiles} ${maxProfiles === 1 ? "account" : "accounts"} with the current package.`,
    );
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

export async function getFleetProfileLimit(fleetId: string) {
  await ensureAccountSchema();

  const result = await getPool().query(
    `
      WITH active_subscription AS (
        SELECT *
        FROM account_subscriptions
        WHERE user_id = $1
          AND status IN ('active', 'trialing')
          AND (current_period_end IS NULL OR current_period_end > NOW())
        ORDER BY created_at DESC
        LIMIT 1
      )
      SELECT slip.plan_key
      FROM active_subscription sub
      LEFT JOIN LATERAL (
        SELECT s.plan_key
        FROM account_manual_payment_slips s
        WHERE s.user_id = $1
          AND s.status = 'approved'
        ORDER BY
          CASE
            WHEN sub.provider_subscription_id IS NOT NULL
             AND (
               s.id::text = sub.provider_subscription_id
               OR s.slip2go_trans_ref = sub.provider_subscription_id
             )
            THEN 0
            ELSE 1
          END,
          s.reviewed_at DESC NULLS LAST,
          s.created_at DESC
        LIMIT 1
      ) slip ON TRUE;
    `,
    [fleetId],
  );

  return getFleetMemberLimitForPackageKey(
    result.rows[0]?.plan_key ? String(result.rows[0].plan_key) : null,
  );
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

export function getFleetMemberLimitForPackageKey(packageKey: string | null | undefined) {
  if (!packageKey) return DEFAULT_FLEET_MEMBER_LIMIT;
  return PACKAGE_FLEET_MEMBER_LIMITS[packageKey] ?? DEFAULT_FLEET_MEMBER_LIMIT;
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

function mapManualPaymentSlip(row: Record<string, unknown>): ManualPaymentSlip {
  return {
    id: String(row.id),
    fleetId: String(row.user_id),
    profileId: row.profile_id ? String(row.profile_id) : null,
    email: String(row.email ?? ""),
    callSign: row.call_sign ? String(row.call_sign) : null,
    planKey: String(row.plan_key),
    planTitle: row.plan_title ? String(row.plan_title) : null,
    amountCents: Number(row.amount_cents),
    amountThb: Number(row.amount_cents) / 100,
    originalAmountCents:
      row.original_amount_cents === null || row.original_amount_cents === undefined
        ? null
        : Number(row.original_amount_cents),
    originalAmountThb:
      row.original_amount_cents === null || row.original_amount_cents === undefined
        ? null
        : Number(row.original_amount_cents) / 100,
    discountCents: Number(row.discount_cents ?? 0),
    discountThb: Number(row.discount_cents ?? 0) / 100,
    promotionCode: row.promotion_code ? String(row.promotion_code) : null,
    currency: String(row.currency),
    bankName: String(row.bank_name),
    accountName: String(row.account_name),
    accountNumber: String(row.account_number),
    promptPayId: row.promptpay_id ? String(row.promptpay_id) : null,
    transferReference: row.transfer_reference
      ? String(row.transfer_reference)
      : null,
    miniQrPayload: row.mini_qr_payload ? String(row.mini_qr_payload) : null,
    slip2goStatus: row.slip2go_status ? String(row.slip2go_status) : null,
    slip2goTransRef: row.slip2go_trans_ref
      ? String(row.slip2go_trans_ref)
      : null,
    slip2goAmountThb:
      row.slip2go_amount_cents === null ||
      row.slip2go_amount_cents === undefined
        ? null
        : Number(row.slip2go_amount_cents) / 100,
    slip2goPayload:
      row.slip2go_payload && typeof row.slip2go_payload === "object"
        ? (row.slip2go_payload as Record<string, unknown>)
        : {},
    verificationError: row.verification_error
      ? String(row.verification_error)
      : null,
    slipFileName: String(row.slip_file_name),
    slipContentType: String(row.slip_content_type),
    note: row.note ? String(row.note) : null,
    status: String(row.status) as ManualPaymentStatus,
    reviewedAt: row.reviewed_at
      ? new Date(String(row.reviewed_at)).toISOString()
      : null,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    rejectionReason: row.rejection_reason
      ? String(row.rejection_reason)
      : null,
    personalFilesSentAt: row.personal_files_sent_at
      ? new Date(String(row.personal_files_sent_at)).toISOString()
      : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function getRowsFromJsonArray(value: unknown): SubscriptionPackageDetail[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return { label: item };
        }
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const record = item as Record<string, unknown>;
          const label = String(record.label ?? record.text ?? "").trim();
          const subDetail = String(
            record.subDetail ?? record.sub_detail ?? record.description ?? "",
          ).trim();
          return label
            ? {
                label,
                subDetail: subDetail || null,
              }
            : null;
        }
        return null;
      })
      .filter((item): item is SubscriptionPackageDetail => Boolean(item));
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return getRowsFromJsonArray(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

function mapSubscriptionPackage(row: Record<string, unknown>): SubscriptionPackage {
  const key = String(row.key);
  return {
    key,
    title: String(row.title),
    description: String(row.description),
    details: getRowsFromJsonArray(row.details),
    priceCents: Number(row.price_cents),
    priceThb: Number(row.price_cents) / 100,
    currency: String(row.currency),
    durationMonths: Number(row.duration_months ?? 1),
    imageUrl: `/api/billing/packages/${key}/image`,
    qrImageUrl: `/api/billing/packages/${key}/qr`,
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function normalizePromotionCode(code: string) {
  return code.trim().toUpperCase();
}

function mapPromotionCode(row: Record<string, unknown>): PromotionCode {
  const discountType = String(row.discount_type) as PromotionDiscountType;
  return {
    code: String(row.code),
    promotionType: String(row.promotion_type ?? "shared") as PromotionCodeType,
    packageKey: String(row.package_key),
    discountType,
    discountValue:
      discountType === "fixed"
        ? Number(row.discount_value) / 100
        : Number(row.discount_value),
    maxRedemptions:
      row.max_redemptions === null || row.max_redemptions === undefined
        ? null
        : Number(row.max_redemptions),
    redeemedCount: Number(row.redeemed_count ?? 0),
    startsAt: row.starts_at
      ? new Date(String(row.starts_at)).toISOString()
      : null,
    endsAt: row.ends_at ? new Date(String(row.ends_at)).toISOString() : null,
    isActive: Boolean(row.is_active),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

async function ensurePromotionSchema() {
  const pool = getPool();

  await pool.query("ALTER TABLE account_manual_payment_slips ADD COLUMN IF NOT EXISTS original_amount_cents INT;");
  await pool.query("ALTER TABLE account_manual_payment_slips ADD COLUMN IF NOT EXISTS discount_cents INT NOT NULL DEFAULT 0;");
  await pool.query("ALTER TABLE account_manual_payment_slips ADD COLUMN IF NOT EXISTS promotion_code TEXT;");
  await pool.query("ALTER TABLE account_manual_payment_slips ADD COLUMN IF NOT EXISTS personal_files_sent_at TIMESTAMPTZ;");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS account_promotion_codes (
      code TEXT PRIMARY KEY,
      promotion_type TEXT NOT NULL DEFAULT 'shared',
      package_key TEXT NOT NULL REFERENCES account_subscription_packages(key) ON DELETE CASCADE,
      discount_type TEXT NOT NULL,
      discount_value INT NOT NULL,
      max_redemptions INT,
      redeemed_count INT NOT NULL DEFAULT 0,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (promotion_type IN ('shared', 'one_time')),
      CHECK (discount_type IN ('percent', 'fixed')),
      CHECK (discount_value > 0),
      CHECK (max_redemptions IS NULL OR max_redemptions > 0),
      CHECK (redeemed_count >= 0)
    );
  `);
  await pool.query("ALTER TABLE account_promotion_codes ADD COLUMN IF NOT EXISTS promotion_type TEXT NOT NULL DEFAULT 'shared';");
  await pool.query("CREATE INDEX IF NOT EXISTS account_promotion_codes_package_idx ON account_promotion_codes(package_key, is_active);");
}

function promotionDiscountValueForStorage(
  discountType: PromotionDiscountType,
  discountValue: number,
) {
  if (discountType === "percent") return Math.round(discountValue);
  return Math.round(discountValue * 100);
}

export function calculatePromotionDiscountCents(
  originalAmountCents: number,
  promotion: PromotionCode,
) {
  if (promotion.discountType === "percent") {
    return Math.min(
      originalAmountCents,
      Math.round((originalAmountCents * promotion.discountValue) / 100),
    );
  }

  return Math.min(originalAmountCents, Math.round(promotion.discountValue * 100));
}

export function applyPromotionToAmount(
  originalAmountCents: number,
  promotion: PromotionCode,
): AppliedPromotion {
  const discountCents = calculatePromotionDiscountCents(
    originalAmountCents,
    promotion,
  );

  return {
    promotion,
    originalAmountCents,
    discountCents,
    finalAmountCents: Math.max(0, originalAmountCents - discountCents),
  };
}

function getEnvManualPaymentConfig(): ManualPaymentConfig {
  const amountFromEnv = process.env.MANUAL_PAYMENT_AMOUNT_THB;
  const parsedAmount = amountFromEnv ? Number(amountFromEnv) : NaN;

  return {
    bankName: process.env.MANUAL_PAYMENT_BANK_NAME || "Krungthai Bank",
    accountName: process.env.MANUAL_PAYMENT_ACCOUNT_NAME || "",
    accountNumber: process.env.MANUAL_PAYMENT_ACCOUNT_NUMBER || "9770273392",
    promptPayId: process.env.MANUAL_PAYMENT_PROMPTPAY_ID || "",
    paymentQrImageUrl: "/api/billing/payment-qr",
    defaultAmountThb:
      Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null,
    currency: process.env.MANUAL_PAYMENT_CURRENCY || "THB",
  };
}

function readMetadataString(
  metadata: Record<string, unknown>,
  key: keyof ManualPaymentConfig,
) {
  const value = metadata[key];
  return typeof value === "string" ? value : undefined;
}

export async function getManualPaymentConfig(): Promise<ManualPaymentConfig> {
  const envConfig = getEnvManualPaymentConfig();
  if (!hasAccountDatabase()) return envConfig;

  await ensureAccountSchema();
  await ensureBillingAssetMetadataColumn();

  const result = await getPool().query(
    `
      SELECT metadata
      FROM account_billing_assets
      WHERE key = 'manual_payment_config'
      LIMIT 1;
    `,
  );

  const metadata =
    result.rows[0]?.metadata && typeof result.rows[0].metadata === "object"
      ? (result.rows[0].metadata as Record<string, unknown>)
      : {};

  return {
    ...envConfig,
    bankName: readMetadataString(metadata, "bankName") ?? envConfig.bankName,
    accountName:
      readMetadataString(metadata, "accountName") ?? envConfig.accountName,
    accountNumber:
      readMetadataString(metadata, "accountNumber") ?? envConfig.accountNumber,
    promptPayId:
      readMetadataString(metadata, "promptPayId") ?? envConfig.promptPayId,
    currency: readMetadataString(metadata, "currency") ?? envConfig.currency,
  };
}

export async function updateManualPaymentConfig(input: {
  bankName: string;
  accountName: string;
  accountNumber: string;
  promptPayId: string;
  currency?: string;
}) {
  await ensureAccountSchema();
  await ensureBillingAssetMetadataColumn();

  const metadata = {
    bankName: input.bankName.trim(),
    accountName: input.accountName.trim(),
    accountNumber: input.accountNumber.trim(),
    promptPayId: input.promptPayId.trim(),
    currency: input.currency?.trim() || "THB",
  };

  await getPool().query(
    `
      INSERT INTO account_billing_assets (key, metadata, updated_at)
      VALUES ('manual_payment_config', $1::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET
        metadata = EXCLUDED.metadata,
        updated_at = NOW();
    `,
    [JSON.stringify(metadata)],
  );

  accountDebug("manual payment config updated", metadata);
  return getManualPaymentConfig();
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
      ),
      active_package AS (
        SELECT slip.plan_key
        FROM account_subscriptions sub
        LEFT JOIN LATERAL (
          SELECT s.plan_key
          FROM account_manual_payment_slips s
          WHERE s.user_id = $1
            AND s.status = 'approved'
          ORDER BY
            CASE
              WHEN sub.provider_subscription_id IS NOT NULL
               AND (
                 s.id::text = sub.provider_subscription_id
                 OR s.slip2go_trans_ref = sub.provider_subscription_id
               )
              THEN 0
              ELSE 1
            END,
            s.reviewed_at DESC NULLS LAST,
            s.created_at DESC
          LIMIT 1
        ) slip ON TRUE
        WHERE sub.user_id = $1
          AND sub.status IN ('active', 'trialing')
          AND (sub.current_period_end IS NULL OR sub.current_period_end > NOW())
        ORDER BY sub.created_at DESC
        LIMIT 1
      ),
      latest_payment_slip AS (
        SELECT to_jsonb(slip_row) AS row
        FROM (
          SELECT
            s.*,
            $2::text AS email,
            p.call_sign,
            pkg.title AS plan_title
          FROM account_manual_payment_slips s
          LEFT JOIN account_profiles p ON p.id = s.profile_id
          LEFT JOIN account_subscription_packages pkg ON pkg.key = s.plan_key
          WHERE s.user_id = $1
          ORDER BY s.created_at DESC
          LIMIT 1
        ) slip_row
      )
      SELECT
        fleet_profiles.rows AS profiles,
        latest_subscription.row AS subscription,
        latest_payment_slip.row AS latest_payment_slip,
        active_package.plan_key AS active_package_key
      FROM fleet_profiles
      LEFT JOIN latest_subscription ON TRUE
      LEFT JOIN active_package ON TRUE
      LEFT JOIN latest_payment_slip ON TRUE;
    `,
    [user.fleetId, user.email],
  );

  const row = result.rows[0] ?? {};
  const profiles = asRows(row.profiles);
  const subscriptionRow = row.subscription as Record<string, unknown> | null;
  const latestPaymentSlipRow = row.latest_payment_slip as
    | Record<string, unknown>
    | null;

  accountDebug("account settings overview loaded", {
    fleetId: user.fleetId,
    profileId: user.profileId,
    profiles: profiles.length,
    durationMs: Date.now() - startedAt,
  });

  return {
    user,
    profiles: profiles.map(mapProfile),
    maxProfiles: getFleetMemberLimitForPackageKey(
      row.active_package_key ? String(row.active_package_key) : null,
    ),
    subscription: mapSubscription(subscriptionRow),
    latestPaymentSlip: latestPaymentSlipRow
      ? mapManualPaymentSlip(latestPaymentSlipRow)
      : null,
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
      ),
      active_package AS (
        SELECT slip.plan_key
        FROM account_subscriptions sub
        JOIN active_profile ap ON ap.fleet_id = sub.user_id
        LEFT JOIN LATERAL (
          SELECT s.plan_key
          FROM account_manual_payment_slips s
          WHERE s.user_id = ap.fleet_id
            AND s.status = 'approved'
          ORDER BY
            CASE
              WHEN sub.provider_subscription_id IS NOT NULL
               AND (
                 s.id::text = sub.provider_subscription_id
                 OR s.slip2go_trans_ref = sub.provider_subscription_id
               )
              THEN 0
              ELSE 1
            END,
            s.reviewed_at DESC NULLS LAST,
            s.created_at DESC
          LIMIT 1
        ) slip ON TRUE
        WHERE sub.status IN ('active', 'trialing')
          AND (sub.current_period_end IS NULL OR sub.current_period_end > NOW())
        ORDER BY sub.created_at DESC
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
        latest_subscription.row AS subscription,
        active_package.plan_key AS active_package_key
      FROM active_profile ap
      CROSS JOIN fleet_profiles fp
      CROSS JOIN recent_scores rs
      CROSS JOIN active_radar ar
      LEFT JOIN active_rank ON active_rank.profile_id = ap.id
      LEFT JOIN latest_subscription ON TRUE
      LEFT JOIN active_package ON TRUE;
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
    maxProfiles: getFleetMemberLimitForPackageKey(
      activeProfile.active_package_key
        ? String(activeProfile.active_package_key)
        : null,
    ),
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

  const now = Date.now();
  if (quizAccessRulesCache && quizAccessRulesCache.expiresAt > now) {
    return quizAccessRulesCache.rules;
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

  const rules = quizTopics.map((topic) => {
    const rule = rulesBySlug.get(topic.slug);
    return (
      rule ?? {
        topicSlug: topic.slug,
        isLocked: Boolean(topic.isLocked),
        updatedAt: new Date(0).toISOString(),
      }
    );
  });

  quizAccessRulesCache = {
    rules,
    expiresAt: now + CONFIG_CACHE_MS,
  };

  return rules;
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

  quizAccessRulesCache = null;
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

export async function createManualPaymentSlip(input: {
  user: AccountUser;
  amountThb: number;
  planKey?: string;
  promotionCode?: string | null;
  originalAmountThb?: number | null;
  discountThb?: number | null;
  transferReference?: string | null;
  miniQrPayload?: string | null;
  slip2goStatus?: string | null;
  slip2goTransRef?: string | null;
  slip2goAmountThb?: number | null;
  slip2goPayload?: Record<string, unknown> | null;
  verificationError?: string | null;
  note?: string | null;
  status?: ManualPaymentStatus;
  reviewedBy?: string | null;
  slipFileName: string;
  slipContentType: string;
  slipBytes: Buffer;
}) {
  await ensureAccountSchema();
  await ensurePromotionSchema();

  if (!Number.isFinite(input.amountThb) || input.amountThb <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const config = await getManualPaymentConfig();
  const amountCents = Math.round(input.amountThb * 100);
  const originalAmountCents =
    input.originalAmountThb === null || input.originalAmountThb === undefined
      ? null
      : Math.round(input.originalAmountThb * 100);
  const discountCents =
    input.discountThb === null || input.discountThb === undefined
      ? 0
      : Math.round(input.discountThb * 100);
  const slip2goAmountCents =
    input.slip2goAmountThb === null || input.slip2goAmountThb === undefined
      ? null
      : Math.round(input.slip2goAmountThb * 100);
  const status = input.status ?? "pending";
  const reviewedAt = status === "pending" ? null : new Date();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        INSERT INTO account_manual_payment_slips (
          user_id,
          profile_id,
          plan_key,
          amount_cents,
          original_amount_cents,
          discount_cents,
          promotion_code,
          currency,
          bank_name,
          account_name,
          account_number,
          promptpay_id,
          transfer_reference,
          mini_qr_payload,
          slip2go_status,
          slip2go_trans_ref,
          slip2go_amount_cents,
          slip2go_payload,
          verification_error,
          slip_file_name,
          slip_content_type,
          slip_bytes,
          note,
          status,
          reviewed_at,
          reviewed_by,
          rejection_reason
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23,
          $24, $25, $26, $27
        )
        RETURNING
          account_manual_payment_slips.*,
          $28::text AS email,
          $29::text AS call_sign,
          (
            SELECT title
            FROM account_subscription_packages pkg
            WHERE pkg.key = account_manual_payment_slips.plan_key
            LIMIT 1
          ) AS plan_title;
      `,
      [
        input.user.fleetId,
        input.user.profileId,
        input.planKey ?? "full_access",
        amountCents,
        originalAmountCents,
        discountCents,
        input.promotionCode ? normalizePromotionCode(input.promotionCode) : null,
        config.currency,
        config.bankName,
        config.accountName,
        config.accountNumber,
        config.promptPayId || null,
        input.transferReference?.trim() || null,
        input.miniQrPayload?.trim() || null,
        input.slip2goStatus?.trim() || null,
        input.slip2goTransRef?.trim() || null,
        slip2goAmountCents,
        JSON.stringify(input.slip2goPayload ?? {}),
        input.verificationError?.trim() || null,
        input.slipFileName,
        input.slipContentType,
        input.slipBytes,
        input.note?.trim() || null,
        status,
        reviewedAt,
        status === "pending" ? null : input.reviewedBy?.trim() || "slip2go",
        status === "rejected" ? input.verificationError?.trim() || null : null,
        input.user.email,
        input.user.name,
      ],
    );

    if (status === "approved") {
      await client.query(
        `
          INSERT INTO account_subscriptions (
            user_id,
            provider,
            provider_subscription_id,
            status,
            current_period_end,
            updated_at
          )
          SELECT
            $1,
            'slip2go',
            $2,
            'active',
            NOW() + make_interval(
              months => GREATEST(
                1,
                COALESCE(
                  (
                    SELECT duration_months
                    FROM account_subscription_packages
                    WHERE key = $3
                    LIMIT 1
                  ),
                  1
                )
              )
            ),
            NOW();
        `,
        [
          input.user.fleetId,
          input.slip2goTransRef?.trim() || result.rows[0].id,
          input.planKey ?? "full_access",
        ],
      );
    }

    if (status === "approved" && input.promotionCode) {
      await client.query(
        `
          UPDATE account_promotion_codes
          SET redeemed_count = redeemed_count + 1,
              updated_at = NOW()
          WHERE code = $1;
        `,
        [normalizePromotionCode(input.promotionCode)],
      );
      promotionCodesCache = null;
    }

    await client.query("COMMIT");

    accountDebug("manual payment slip created", {
      slipId: result.rows[0].id,
      fleetId: input.user.fleetId,
      amountCents,
      status,
      slip2goTransRef: input.slip2goTransRef ?? null,
    });

    return mapManualPaymentSlip(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new Error("This transfer reference has already been used.");
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getManualPaymentSlipBySlip2GoTransRef(transRef: string) {
  const normalizedTransRef = transRef.trim();
  if (!normalizedTransRef) return null;

  await ensureAccountSchema();

  const result = await getPool().query(
    `
      SELECT
        s.*,
        u.email,
        p.call_sign,
        pkg.title AS plan_title
      FROM account_manual_payment_slips s
      JOIN account_users u ON u.id = s.user_id
      LEFT JOIN account_profiles p ON p.id = s.profile_id
      LEFT JOIN account_subscription_packages pkg ON pkg.key = s.plan_key
      WHERE s.slip2go_trans_ref = $1
      LIMIT 1;
    `,
    [normalizedTransRef],
  );

  return result.rows[0] ? mapManualPaymentSlip(result.rows[0]) : null;
}

export async function getSubscriptionPackages(input?: { includeInactive?: boolean }) {
  if (!hasAccountDatabase()) return [];
  const cacheKey = input?.includeInactive ? "all" : "active";
  const now = Date.now();
  const cached = subscriptionPackagesCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.packages;
  }

  await ensureAccountSchema();

  const result = await getPool().query(
    `
      SELECT *
      FROM account_subscription_packages
      WHERE $1::boolean = TRUE OR is_active = TRUE
      ORDER BY sort_order ASC, price_cents ASC, key ASC;
    `,
    [Boolean(input?.includeInactive)],
  );

  const packages = result.rows.map(mapSubscriptionPackage);
  subscriptionPackagesCache.set(cacheKey, {
    packages,
    expiresAt: now + CONFIG_CACHE_MS,
  });
  return packages;
}

export async function getSubscriptionPackage(packageKey: string) {
  await ensureAccountSchema();

  const result = await getPool().query(
    `
      SELECT *
      FROM account_subscription_packages
      WHERE key = $1
      LIMIT 1;
    `,
    [packageKey],
  );

  if (result.rowCount === 0) return null;
  subscriptionPackagesCache.clear();
  return mapSubscriptionPackage(result.rows[0]);
}

export async function getSubscriptionPackageFile(
  packageKey: string,
  kind: "image" | "qr",
) {
  await ensureAccountSchema();

  const result = await getPool().query(
    `
      SELECT
        ${kind === "image" ? "image_file_name" : "qr_file_name"} AS file_name,
        ${kind === "image" ? "image_content_type" : "qr_content_type"} AS content_type,
        ${kind === "image" ? "image_bytes" : "qr_bytes"} AS bytes
      FROM account_subscription_packages
      WHERE key = $1
      LIMIT 1;
    `,
    [packageKey],
  );

  if (result.rowCount === 0 || !result.rows[0].bytes) return null;
  return {
    fileName: result.rows[0].file_name
      ? String(result.rows[0].file_name)
      : `${packageKey}-${kind}`,
    contentType: result.rows[0].content_type
      ? String(result.rows[0].content_type)
      : "image/png",
    bytes: result.rows[0].bytes as Buffer,
  };
}

export async function getBillingAssetFile(key: string) {
  await ensureAccountSchema();

  const result = await getPool().query(
    `
      SELECT file_name, content_type, bytes
      FROM account_billing_assets
      WHERE key = $1
      LIMIT 1;
    `,
    [key],
  );

  if (result.rowCount === 0 || !result.rows[0].bytes) return null;
  return {
    fileName: result.rows[0].file_name
      ? String(result.rows[0].file_name)
      : key,
    contentType: result.rows[0].content_type
      ? String(result.rows[0].content_type)
      : "image/png",
    bytes: result.rows[0].bytes as Buffer,
  };
}

export async function updatePaymentQrAsset(input: {
  fileName: string;
  contentType: string;
  bytes: Buffer;
}) {
  await ensureAccountSchema();

  const result = await getPool().query(
    `
      INSERT INTO account_billing_assets (
        key,
        file_name,
        content_type,
        bytes,
        updated_at
      )
      VALUES ('payment_qr', $1, $2, $3, NOW())
      ON CONFLICT (key)
      DO UPDATE SET
        file_name = EXCLUDED.file_name,
        content_type = EXCLUDED.content_type,
        bytes = EXCLUDED.bytes,
        updated_at = NOW()
      RETURNING key, file_name, content_type, updated_at;
    `,
    [input.fileName, input.contentType, input.bytes],
  );

  accountDebug("payment QR asset updated", {
    fileName: input.fileName,
    contentType: input.contentType,
  });

  return {
    key: String(result.rows[0].key),
    fileName: result.rows[0].file_name
      ? String(result.rows[0].file_name)
      : null,
    contentType: result.rows[0].content_type
      ? String(result.rows[0].content_type)
      : null,
    updatedAt: new Date(String(result.rows[0].updated_at)).toISOString(),
  };
}

export async function updateSubscriptionPackage(input: {
  key: string;
  title: string;
  description: string;
  details: SubscriptionPackageDetail[];
  priceThb: number;
  durationMonths: number;
  currency?: string;
  isActive: boolean;
  sortOrder: number;
}) {
  await ensureAccountSchema();

  if (!input.key.trim()) throw new Error("Package key is required.");
  if (!input.title.trim()) throw new Error("Package title is required.");
  if (!Number.isFinite(input.priceThb) || input.priceThb <= 0) {
    throw new Error("Package price must be greater than zero.");
  }
  if (![1, 6, 12].includes(input.durationMonths)) {
    throw new Error("Package duration must be 1, 6, or 12 months.");
  }

  const result = await getPool().query(
    `
      INSERT INTO account_subscription_packages (
        key,
        title,
        description,
        details,
        price_cents,
        currency,
        duration_months,
        is_active,
        sort_order,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        NOW()
      )
      ON CONFLICT (key)
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        details = EXCLUDED.details,
        price_cents = EXCLUDED.price_cents,
        currency = EXCLUDED.currency,
        duration_months = EXCLUDED.duration_months,
        is_active = EXCLUDED.is_active,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
      RETURNING *;
    `,
    [
      input.key.trim(),
      input.title.trim(),
      input.description.trim(),
      JSON.stringify(
        input.details
          .map((item) => ({
            label: item.label.trim(),
            subDetail: item.subDetail?.trim() || null,
          }))
          .filter((item) => item.label),
      ),
      Math.round(input.priceThb * 100),
      input.currency || "THB",
      input.durationMonths,
      input.isActive,
      input.sortOrder,
    ],
  );

  return mapSubscriptionPackage(result.rows[0]);
}

export async function getPromotionCodes(input?: { includeInactive?: boolean }) {
  if (!hasAccountDatabase()) return [];

  const now = Date.now();
  if (
    !input?.includeInactive &&
    promotionCodesCache &&
    promotionCodesCache.expiresAt > now
  ) {
    return promotionCodesCache.promotions;
  }

  await ensureAccountSchema();
  await ensurePromotionSchema();

  const result = await getPool().query(
    `
      SELECT *
      FROM account_promotion_codes
      WHERE $1::boolean = TRUE OR is_active = TRUE
      ORDER BY updated_at DESC, code ASC;
    `,
    [Boolean(input?.includeInactive)],
  );

  const promotions = result.rows.map(mapPromotionCode);
  if (!input?.includeInactive) {
    promotionCodesCache = {
      promotions,
      expiresAt: now + CONFIG_CACHE_MS,
    };
  }
  return promotions;
}

export async function getPromotionCode(code: string) {
  const normalizedCode = normalizePromotionCode(code);
  if (!normalizedCode) return null;

  await ensureAccountSchema();
  await ensurePromotionSchema();

  const result = await getPool().query(
    `
      SELECT *
      FROM account_promotion_codes
      WHERE code = $1
      LIMIT 1;
    `,
    [normalizedCode],
  );

  if (result.rowCount === 0) return null;
  return mapPromotionCode(result.rows[0]);
}

export async function validatePromotionCodeForPackage(input: {
  code: string;
  packageKey: string;
  originalAmountCents: number;
}) {
  const promotion = await getPromotionCode(input.code);
  if (!promotion) return null;

  const now = Date.now();
  if (!promotion.isActive) return null;
  if (promotion.packageKey !== input.packageKey) return null;
  if (promotion.startsAt && new Date(promotion.startsAt).getTime() > now) {
    return null;
  }
  if (promotion.endsAt && new Date(promotion.endsAt).getTime() < now) {
    return null;
  }
  if (
    promotion.maxRedemptions !== null &&
    promotion.redeemedCount >= promotion.maxRedemptions
  ) {
    return null;
  }

  const applied = applyPromotionToAmount(input.originalAmountCents, promotion);
  return applied.discountCents > 0 && applied.finalAmountCents > 0
    ? applied
    : null;
}

export async function upsertPromotionCode(input: {
  code: string;
  promotionType?: PromotionCodeType;
  packageKey: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxRedemptions?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
}) {
  await ensureAccountSchema();
  await ensurePromotionSchema();

  const code = normalizePromotionCode(input.code);
  const promotionType = input.promotionType ?? "shared";
  if (!code) throw new Error("Promotion code is required.");
  if (promotionType !== "shared" && promotionType !== "one_time") {
    throw new Error("Promotion type must be shared or one-time.");
  }
  if (!input.packageKey.trim()) throw new Error("Package is required.");
  if (input.discountType !== "percent" && input.discountType !== "fixed") {
    throw new Error("Discount type must be percent or fixed.");
  }
  if (!Number.isFinite(input.discountValue) || input.discountValue <= 0) {
    throw new Error("Discount value must be greater than zero.");
  }
  if (input.discountType === "percent" && input.discountValue > 100) {
    throw new Error("Percent discount cannot be greater than 100.");
  }
  if (
    input.maxRedemptions !== null &&
    input.maxRedemptions !== undefined &&
    (!Number.isInteger(input.maxRedemptions) || input.maxRedemptions <= 0)
  ) {
    throw new Error("Max redemptions must be a positive whole number.");
  }
  if (
    input.startsAt &&
    input.endsAt &&
    new Date(input.startsAt).getTime() > new Date(input.endsAt).getTime()
  ) {
    throw new Error("Start date must be before end date.");
  }

  const result = await getPool().query(
    `
      INSERT INTO account_promotion_codes (
        code,
        promotion_type,
        package_key,
        discount_type,
        discount_value,
        max_redemptions,
        starts_at,
        ends_at,
        is_active,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (code)
      DO UPDATE SET
        promotion_type = EXCLUDED.promotion_type,
        package_key = EXCLUDED.package_key,
        discount_type = EXCLUDED.discount_type,
        discount_value = EXCLUDED.discount_value,
        max_redemptions = EXCLUDED.max_redemptions,
        starts_at = EXCLUDED.starts_at,
        ends_at = EXCLUDED.ends_at,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING *;
    `,
    [
      code,
      promotionType,
      input.packageKey.trim(),
      input.discountType,
      promotionDiscountValueForStorage(input.discountType, input.discountValue),
      input.maxRedemptions ?? null,
      input.startsAt || null,
      input.endsAt || null,
      input.isActive,
    ],
  );

  promotionCodesCache = null;
  return mapPromotionCode(result.rows[0]);
}

export async function generateOneTimePromotionCodes(input: {
  prefix?: string | null;
  quantity: number;
  packageKey: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  isActive: boolean;
}) {
  await ensureAccountSchema();
  await ensurePromotionSchema();

  const prefix = normalizePromotionCode(input.prefix ?? "");
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }
  if (input.quantity > 500) {
    throw new Error("Quantity cannot be greater than 500.");
  }
  if (!input.packageKey.trim()) throw new Error("Package is required.");
  if (input.discountType !== "percent" && input.discountType !== "fixed") {
    throw new Error("Discount type must be percent or fixed.");
  }
  if (!Number.isFinite(input.discountValue) || input.discountValue <= 0) {
    throw new Error("Discount value must be greater than zero.");
  }
  if (input.discountType === "percent" && input.discountValue > 100) {
    throw new Error("Percent discount cannot be greater than 100.");
  }
  const client = await getPool().connect();
  const generated: PromotionCode[] = [];
  const seenCodes = new Set<string>();

  try {
    await client.query("BEGIN");

    while (generated.length < input.quantity) {
      const code = `${prefix}${randomBytes(4).toString("hex").toUpperCase()}`;
      if (seenCodes.has(code)) continue;
      seenCodes.add(code);

      const result = await client.query(
        `
          INSERT INTO account_promotion_codes (
            code,
            promotion_type,
            package_key,
            discount_type,
            discount_value,
            max_redemptions,
            starts_at,
            ends_at,
            is_active,
            updated_at
          )
          VALUES ($1, 'one_time', $2, $3, $4, 1, NULL, NULL, $5, NOW())
          ON CONFLICT (code) DO NOTHING
          RETURNING *;
        `,
        [
          code,
          input.packageKey.trim(),
          input.discountType,
          promotionDiscountValueForStorage(
            input.discountType,
            input.discountValue,
          ),
          input.isActive,
        ],
      );

      if ((result.rowCount ?? 0) > 0) {
        generated.push(mapPromotionCode(result.rows[0]));
      }
    }

    await client.query("COMMIT");
    promotionCodesCache = null;
    return generated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deletePromotionCode(code: string) {
  await ensureAccountSchema();
  await ensurePromotionSchema();

  const normalizedCode = normalizePromotionCode(code);
  const result = await getPool().query(
    `
      DELETE FROM account_promotion_codes
      WHERE code = $1
      RETURNING *;
    `,
    [normalizedCode],
  );

  promotionCodesCache = null;
  return (result.rowCount ?? 0) > 0 ? mapPromotionCode(result.rows[0]) : null;
}

export async function bulkUpdatePromotionCodes(input: {
  codes: string[];
  action: "activate" | "deactivate" | "delete";
}) {
  await ensureAccountSchema();
  await ensurePromotionSchema();

  const codes = Array.from(
    new Set(input.codes.map(normalizePromotionCode).filter(Boolean)),
  );
  if (codes.length === 0) throw new Error("Select at least one promotion code.");

  if (input.action === "delete") {
    const result = await getPool().query(
      `
        DELETE FROM account_promotion_codes
        WHERE code = ANY($1::text[])
        RETURNING *;
      `,
      [codes],
    );
    promotionCodesCache = null;
    return result.rows.map(mapPromotionCode);
  }

  const isActive = input.action === "activate";
  const result = await getPool().query(
    `
      UPDATE account_promotion_codes
      SET is_active = $2,
          updated_at = NOW()
      WHERE code = ANY($1::text[])
      RETURNING *;
    `,
    [codes, isActive],
  );

  promotionCodesCache = null;
  return result.rows.map(mapPromotionCode);
}

export async function getManualPaymentSlipsForFleet(fleetId: string) {
  await ensureAccountSchema();

  const result = await getPool().query(
    `
      SELECT
        s.*,
        u.email,
        p.call_sign,
        pkg.title AS plan_title
      FROM account_manual_payment_slips s
      JOIN account_users u ON u.id = s.user_id
      LEFT JOIN account_profiles p ON p.id = s.profile_id
      LEFT JOIN account_subscription_packages pkg ON pkg.key = s.plan_key
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC;
    `,
    [fleetId],
  );

  return result.rows.map(mapManualPaymentSlip);
}

export async function getManualPaymentSlipFile(slipId: string) {
  await ensureAccountSchema();

  const result = await getPool().query(
    `
      SELECT
        user_id,
        slip_file_name,
        slip_content_type,
        slip_bytes
      FROM account_manual_payment_slips
      WHERE id = $1
      LIMIT 1;
    `,
    [slipId],
  );

  if (result.rowCount === 0) return null;

  const row = result.rows[0];
  return {
    fleetId: String(row.user_id),
    fileName: String(row.slip_file_name),
    contentType: String(row.slip_content_type),
    bytes: row.slip_bytes as Buffer,
  };
}

export async function getAdminManualPaymentSlips() {
  await ensureAccountSchema();

  const result = await getPool().query(
    `
      SELECT
        s.*,
        u.email,
        p.call_sign,
        pkg.title AS plan_title
      FROM account_manual_payment_slips s
      JOIN account_users u ON u.id = s.user_id
      LEFT JOIN account_profiles p ON p.id = s.profile_id
      LEFT JOIN account_subscription_packages pkg ON pkg.key = s.plan_key
      ORDER BY
        CASE s.status
          WHEN 'pending' THEN 0
          WHEN 'rejected' THEN 1
          ELSE 2
        END,
        s.created_at DESC;
    `,
  );

  return result.rows.map(mapManualPaymentSlip);
}

export async function reviewManualPaymentSlip(input: {
  slipId: string;
  action: "approve" | "reject";
  reviewedBy?: string | null;
  rejectionReason?: string | null;
}) {
  await ensureAccountSchema();
  await ensurePromotionSchema();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const slipResult = await client.query(
      `
        SELECT *
        FROM account_manual_payment_slips
        WHERE id = $1
        FOR UPDATE;
      `,
      [input.slipId],
    );

    if (slipResult.rowCount === 0) {
      throw new Error("Payment slip not found.");
    }

    const currentStatus = String(slipResult.rows[0].status);
    if (currentStatus !== "pending") {
      throw new Error(`Payment slip has already been ${currentStatus}.`);
    }

    const status = input.action === "approve" ? "approved" : "rejected";
    const updateResult = await client.query(
      `
        UPDATE account_manual_payment_slips
        SET status = $2,
            reviewed_at = NOW(),
            reviewed_by = $3,
            rejection_reason = $4,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `,
      [
        input.slipId,
        status,
        input.reviewedBy?.trim() || null,
        input.action === "reject" ? input.rejectionReason?.trim() || null : null,
      ],
    );

    if (input.action === "approve") {
      await client.query(
        `
          INSERT INTO account_subscriptions (
            user_id,
            provider,
            provider_subscription_id,
            status,
            current_period_end,
            updated_at
          )
          SELECT
            $1,
            'manual-slip',
            $2,
            'active',
            NOW() + make_interval(
              months => GREATEST(
                1,
                COALESCE(
                  (
                    SELECT duration_months
                    FROM account_subscription_packages
                    WHERE key = $3
                    LIMIT 1
                  ),
                  1
                )
              )
            ),
            NOW();
        `,
        [slipResult.rows[0].user_id, input.slipId, slipResult.rows[0].plan_key],
      );

      if (slipResult.rows[0].promotion_code) {
        await client.query(
          `
            UPDATE account_promotion_codes
            SET redeemed_count = redeemed_count + 1,
                updated_at = NOW()
            WHERE code = $1;
          `,
          [String(slipResult.rows[0].promotion_code)],
        );
        promotionCodesCache = null;
      }
    }

    await client.query("COMMIT");

    accountDebug("manual payment slip reviewed", {
      slipId: input.slipId,
      action: input.action,
      fleetId: slipResult.rows[0].user_id,
    });

    const decoratedResult = await pool.query(
      `
        SELECT
          s.*,
          u.email,
          p.call_sign,
          pkg.title AS plan_title
        FROM account_manual_payment_slips s
        JOIN account_users u ON u.id = s.user_id
        LEFT JOIN account_profiles p ON p.id = s.profile_id
        LEFT JOIN account_subscription_packages pkg ON pkg.key = s.plan_key
        WHERE s.id = $1
        LIMIT 1;
      `,
      [input.slipId],
    );

    return mapManualPaymentSlip(decoratedResult.rows[0] ?? updateResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function setManualPaymentPersonalFilesSent(input: {
  slipId: string;
  sent: boolean;
}) {
  await ensureAccountSchema();
  await ensurePromotionSchema();

  const result = await getPool().query(
    `
      UPDATE account_manual_payment_slips
      SET personal_files_sent_at = CASE WHEN $2::boolean THEN NOW() ELSE NULL END,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `,
    [input.slipId, input.sent],
  );

  if (result.rowCount === 0) {
    throw new Error("Payment slip not found.");
  }

  accountDebug("manual payment personal files updated", {
    slipId: input.slipId,
    sent: input.sent,
  });

  const decoratedResult = await getPool().query(
    `
      SELECT
        s.*,
        u.email,
        p.call_sign,
        pkg.title AS plan_title
      FROM account_manual_payment_slips s
      JOIN account_users u ON u.id = s.user_id
      LEFT JOIN account_profiles p ON p.id = s.profile_id
      LEFT JOIN account_subscription_packages pkg ON pkg.key = s.plan_key
      WHERE s.id = $1
      LIMIT 1;
    `,
    [input.slipId],
  );

  return mapManualPaymentSlip(decoratedResult.rows[0] ?? result.rows[0]);
}

export async function getAdminBillingOverview() {
  await ensureAccountSchema();

  const [
    fleetResult,
    quizAccess,
    manualPaymentSlips,
    subscriptionPackages,
    promotionCodes,
  ] =
    await Promise.all([
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
          latest_slip.plan_key AS latest_package_key,
          pkg.title AS latest_package_title,
          latest_slip.amount_cents AS latest_package_amount_cents,
          latest_slip.promotion_code AS latest_promotion_code,
          latest_slip.personal_files_sent_at AS latest_personal_files_sent_at,
          pkg.duration_months AS latest_package_duration_months,
          latest_slip.id AS latest_slip_id,
          latest_slip.slip2go_trans_ref AS latest_slip2go_trans_ref,
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
        LEFT JOIN LATERAL (
          SELECT *
          FROM account_manual_payment_slips slip
          WHERE slip.user_id = u.id
            AND slip.status = 'approved'
          ORDER BY slip.reviewed_at DESC NULLS LAST, slip.created_at DESC
          LIMIT 1
        ) latest_slip ON TRUE
        LEFT JOIN account_subscription_packages pkg
          ON pkg.key = latest_slip.plan_key
        LEFT JOIN account_profiles p
          ON p.user_id = u.id
        LEFT JOIN account_sessions sess
          ON sess.user_id = u.id
         AND sess.expires_at > NOW()
        GROUP BY
          u.id,
          s.status,
          s.provider,
          s.current_period_end,
          latest_slip.plan_key,
          latest_slip.id,
          latest_slip.amount_cents,
          latest_slip.promotion_code,
          latest_slip.personal_files_sent_at,
          latest_slip.slip2go_trans_ref,
          pkg.title,
          pkg.duration_months
        ORDER BY u.created_at DESC;
      `,
    ),
    getQuizAccessRules(),
    getAdminManualPaymentSlips(),
    getSubscriptionPackages({ includeInactive: true }),
    getPromotionCodes({ includeInactive: true }),
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
    latestPackageKey: row.latest_package_key
      ? String(row.latest_package_key)
      : null,
    latestPackageTitle: row.latest_package_title
      ? String(row.latest_package_title)
      : null,
    latestPackageAmountThb:
      row.latest_package_amount_cents === null ||
      row.latest_package_amount_cents === undefined
        ? null
        : Number(row.latest_package_amount_cents) / 100,
    latestPackageDurationMonths:
      row.latest_package_duration_months === null ||
      row.latest_package_duration_months === undefined
        ? null
        : Number(row.latest_package_duration_months),
    latestSlipId: row.latest_slip_id ? String(row.latest_slip_id) : null,
    latestSlip2goTransRef: row.latest_slip2go_trans_ref
      ? String(row.latest_slip2go_trans_ref)
      : null,
    latestPromotionCode: row.latest_promotion_code
      ? String(row.latest_promotion_code)
      : null,
    latestPersonalFilesSentAt: row.latest_personal_files_sent_at
      ? new Date(String(row.latest_personal_files_sent_at)).toISOString()
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
    manualPaymentSlips,
    manualPaymentConfig: await getManualPaymentConfig(),
    subscriptionPackages,
    promotionCodes,
  };
}

export interface LeaderboardContextEntry {
  profileId: string;
  displayName: string;
  imageUrl: string | null;
  rank: number;
  dashboardAverage: number;
  isCurrentUser: boolean;
}

export async function getLeaderboardContext(
  profileId: string,
): Promise<LeaderboardContextEntry[]> {
  await ensureAccountSchema();
  const pool = getPool();
  const result = await pool.query<{
    profile_id: string;
    name: string;
    image_url: string | null;
    actual_platform_rank: number;
    dashboard_average: number;
    is_current_user: boolean;
  }>(
    `
      WITH normalized_scores AS (
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
          RANK() OVER (
            ORDER BY dashboard_average DESC, total_attempts DESC, profile_id ASC
          )::int AS actual_platform_rank
        FROM profile_avgs
      ),
      user_rank AS (
        SELECT actual_platform_rank AS r
        FROM ranked_profiles
        WHERE profile_id = $1
      )
      SELECT
        rp.profile_id,
        u.name,
        u.image_url,
        rp.actual_platform_rank,
        rp.dashboard_average,
        (rp.profile_id = $1) AS is_current_user
      FROM ranked_profiles rp
      JOIN account_profiles ap ON ap.id = rp.profile_id
      JOIN account_users u ON u.id = ap.user_id
      WHERE
        rp.actual_platform_rank <= 3
        OR rp.actual_platform_rank BETWEEN
          GREATEST(1, (SELECT r FROM user_rank) - 2)
          AND (SELECT r FROM user_rank) + 2
      ORDER BY rp.actual_platform_rank
    `,
    [profileId],
  );

  return result.rows.map((row) => {
    const parts = (row.name ?? "").trim().split(/\s+/);
    const displayName =
      parts.length >= 2
        ? `${parts[0]} ${parts[parts.length - 1].slice(0, 1)}.`
        : (parts[0] ?? "Pilot");
    return {
      profileId: row.profile_id,
      displayName,
      imageUrl: row.image_url ?? null,
      rank: Number(row.actual_platform_rank),
      dashboardAverage: Math.round(Number(row.dashboard_average)),
      isCurrentUser: Boolean(row.is_current_user),
    };
  });
}

export async function getProfileRank(profileId: string): Promise<number | null> {
  await ensureAccountSchema();
  const pool = getPool();
  const result = await pool.query<{ actual_platform_rank: number | null }>(
    `
      WITH normalized_scores AS (
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
          RANK() OVER (
            ORDER BY dashboard_average DESC, total_attempts DESC, profile_id ASC
          )::int AS actual_platform_rank
        FROM profile_avgs
      )
      SELECT actual_platform_rank FROM ranked_profiles WHERE profile_id = $1 LIMIT 1
    `,
    [profileId],
  );
  return result.rows[0]?.actual_platform_rank ?? null;
}
