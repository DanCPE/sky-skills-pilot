import { promises as fs } from "fs";
import path from "path";
import { Pool } from "pg";
import type { BroadcastInput, BroadcastSettings } from "@/types/broadcast";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "broadcast.json");
const broadcastRowId = "site";

let broadcastPool: Pool | null = null;
let broadcastSchemaReady = false;
let broadcastSchemaPromise: Promise<void> | null = null;

const defaultBroadcastSettings: BroadcastSettings = {
  phrase: "",
  updatedAt: new Date(0).toISOString(),
};

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DB_URL ||
    process.env.SUPABASE_DB_URL ||
    null
  );
}

function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

function getPool() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("Broadcast database is not configured.");
  }

  if (!broadcastPool) {
    broadcastPool = new Pool({
      connectionString: databaseUrl,
      max: Number(process.env.PG_POOL_MAX ?? 1) || 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      ssl: { rejectUnauthorized: false },
    });
  }

  return broadcastPool;
}

async function ensureBroadcastSchema() {
  if (!hasDatabase() || broadcastSchemaReady) return;
  if (broadcastSchemaPromise) return broadcastSchemaPromise;

  broadcastSchemaPromise = (async () => {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_broadcast_settings (
        id TEXT PRIMARY KEY,
        phrase TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(
      `
        INSERT INTO site_broadcast_settings (id, phrase)
        VALUES ($1, '')
        ON CONFLICT (id) DO NOTHING;
      `,
      [broadcastRowId],
    );
    broadcastSchemaReady = true;
  })();

  try {
    await broadcastSchemaPromise;
  } finally {
    broadcastSchemaPromise = null;
  }
}

async function readBroadcastSettingsFromDatabase() {
  await ensureBroadcastSchema();

  const result = await getPool().query(
    `
      SELECT phrase, updated_at
      FROM site_broadcast_settings
      WHERE id = $1
      LIMIT 1;
    `,
    [broadcastRowId],
  );
  const row = result.rows[0];

  if (!row) return defaultBroadcastSettings;

  return {
    phrase: typeof row.phrase === "string" ? row.phrase : "",
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : new Date(row.updated_at).toISOString(),
  };
}

async function updateBroadcastSettingsInDatabase(input: Partial<BroadcastInput>) {
  const phrase = input.phrase?.trim() ?? "";

  await ensureBroadcastSchema();

  const result = await getPool().query(
    `
      INSERT INTO site_broadcast_settings (id, phrase, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        phrase = EXCLUDED.phrase,
        updated_at = NOW()
      RETURNING phrase, updated_at;
    `,
    [broadcastRowId, phrase],
  );
  const row = result.rows[0];

  return {
    phrase: row.phrase,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : new Date(row.updated_at).toISOString(),
  };
}

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(
      dataFile,
      `${JSON.stringify(defaultBroadcastSettings, null, 2)}\n`,
      "utf8",
    );
  }
}

export async function readBroadcastSettings() {
  if (hasDatabase()) {
    return readBroadcastSettingsFromDatabase();
  }

  await ensureDataFile();

  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw) as Partial<BroadcastSettings>;

  return {
    ...defaultBroadcastSettings,
    ...parsed,
    phrase: typeof parsed.phrase === "string" ? parsed.phrase : "",
    updatedAt:
      typeof parsed.updatedAt === "string"
        ? parsed.updatedAt
        : defaultBroadcastSettings.updatedAt,
  };
}

export async function updateBroadcastSettings(input: Partial<BroadcastInput>) {
  if (hasDatabase()) {
    return updateBroadcastSettingsInDatabase(input);
  }

  const phrase = input.phrase?.trim() ?? "";
  const nextSettings: BroadcastSettings = {
    phrase,
    updatedAt: new Date().toISOString(),
  };

  await ensureDataFile();
  await fs.writeFile(
    dataFile,
    `${JSON.stringify(nextSettings, null, 2)}\n`,
    "utf8",
  );

  return nextSettings;
}
