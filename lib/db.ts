import { neon } from "@neondatabase/serverless";

// Resolve connection string from common Neon/PG envs
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE
    ? `postgresql://${encodeURIComponent(process.env.PGUSER!)}:${encodeURIComponent(process.env.PGPASSWORD || "")}` +
      `@${process.env.PGHOST}/${encodeURIComponent(process.env.PGDATABASE!)}?sslmode=${process.env.PGSSLMODE || "require"}`
    : undefined);

if (!connectionString) {
  throw new Error(
    "No database connection string found. Set one of: DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING, DATABASE_URL_UNPOOLED or PG* variables."
  );
}

export const sql = neon(connectionString);

export async function healthcheck() {
  const result = await sql`select 1 as ok`;
  return result?.[0]?.ok === 1;
}
