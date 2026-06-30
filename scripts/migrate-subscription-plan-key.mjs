import nextEnv from "@next/env";
import pg from "pg";

const { loadEnvConfig } = nextEnv;
const { Pool } = pg;

loadEnvConfig(process.cwd());

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DB_URL ||
  process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error(
    "Missing database URL. Set DATABASE_URL, POSTGRES_URL, DB_URL, or SUPABASE_DB_URL.",
  );
  process.exit(1);
}

async function main() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const target = await pool.query(`
      SELECT
        current_database() AS database,
        current_schema() AS schema,
        current_user AS user,
        inet_server_addr()::text AS host;
    `);

    console.log("Connected database:", target.rows[0]);

    await pool.query(`
      ALTER TABLE public.account_subscriptions
      ADD COLUMN IF NOT EXISTS plan_key TEXT;
    `);

    const verification = await pool.query(`
      SELECT
        table_schema,
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'account_subscriptions'
        AND column_name = 'plan_key'
      LIMIT 1;
    `);

    if (verification.rowCount !== 1) {
      throw new Error("Migration ran, but plan_key was not found afterward.");
    }

    console.log("Verified column:", verification.rows[0]);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
