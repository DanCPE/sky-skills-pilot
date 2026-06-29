import { Pool } from "pg";

export interface HomeAudienceStats {
  registeredUsers: number;
  estimatedUnregisteredUsers: number;
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

export async function getHomeAudienceStats(): Promise<HomeAudienceStats> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return {
      registeredUsers: 0,
      estimatedUnregisteredUsers: 0,
    };
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    idleTimeoutMillis: 1_000,
    connectionTimeoutMillis: 3_000,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const result = await pool.query<{
      registered_users: string;
      unique_clients: string;
    }>(`
      SELECT
        COALESCE((SELECT COUNT(*) FROM account_users), 0)::text AS registered_users,
        COALESCE((SELECT COUNT(DISTINCT ip_hash) FROM analytics_events), 0)::text AS unique_clients;
    `);

    const registeredUsers = Number(result.rows[0]?.registered_users ?? "0");
    const uniqueClients = Number(result.rows[0]?.unique_clients ?? "0");

    return {
      registeredUsers,
      estimatedUnregisteredUsers: Math.max(0, uniqueClients - registeredUsers),
    };
  } catch (error) {
    console.error("[home] failed to load audience stats", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      registeredUsers: 0,
      estimatedUnregisteredUsers: 0,
    };
  } finally {
    await pool.end().catch(() => undefined);
  }
}
