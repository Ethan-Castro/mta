import { neon } from "@neondatabase/serverless";

// Sanitize env values: trim, drop surrounding quotes, and remove literal \n sequences
function sanitizeEnv(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^(["'])(.*)\1$/, "$2");
  // Remove any literal "\n" sequences that sometimes get injected by CLIs
  const withoutEscapedNewlines = trimmed.replace(/\\n/g, "");
  return withoutEscapedNewlines;
}

function firstDefinedSanitized(...values: Array<string | undefined>) {
  for (const v of values) {
    const s = sanitizeEnv(v);
    if (s) return s;
  }
  return undefined;
}

// Resolve connection string from common Neon/PG envs (supports MTA_DB_* aliases)
const connectionString =
  firstDefinedSanitized(
    process.env.DATABASE_URL,
    process.env.MTA_DB_DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    (process as any).env.MTA_DB_POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    (process as any).env.MTA_DB_POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    (process as any).env.MTA_DB_POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL_UNPOOLED,
    (process as any).env.MTA_DB_DATABASE_URL_UNPOOLED
  ) ||
  (() => {
    const host = firstDefinedSanitized(
      process.env.PGHOST,
      (process as any).env.MTA_DB_PGHOST,
      process.env.POSTGRES_HOST,
      (process as any).env.MTA_DB_POSTGRES_HOST
    );
    const user = firstDefinedSanitized(
      process.env.PGUSER,
      (process as any).env.MTA_DB_PGUSER,
      process.env.POSTGRES_USER,
      (process as any).env.MTA_DB_POSTGRES_USER
    );
    const password = firstDefinedSanitized(
      process.env.PGPASSWORD,
      (process as any).env.MTA_DB_PGPASSWORD,
      process.env.POSTGRES_PASSWORD,
      (process as any).env.MTA_DB_POSTGRES_PASSWORD
    );
    const database = firstDefinedSanitized(
      process.env.PGDATABASE,
      (process as any).env.MTA_DB_PGDATABASE,
      process.env.POSTGRES_DATABASE,
      (process as any).env.MTA_DB_POSTGRES_DATABASE
    );
    const sslmode = sanitizeEnv(process.env.PGSSLMODE) || "require";
    if (host && user && database) {
      const encodedUser = encodeURIComponent(user);
      const encodedPassword = encodeURIComponent(password || "");
      const encodedDb = encodeURIComponent(database);
      return `postgresql://${encodedUser}:${encodedPassword}@${host}/${encodedDb}?sslmode=${sslmode}`;
    }
    return undefined;
  })();

export const isDbConfigured = Boolean(connectionString);

function createSqlStub() {
  const err = () => {
    throw new Error(
      "Database is not configured. Set DATABASE_URL or PG* environment variables to enable database features."
    );
  };
  const stub: any = err;
  stub.unsafe = err;
  return stub;
}

export const sql = isDbConfigured ? neon(connectionString as string) : (createSqlStub() as ReturnType<typeof neon>);

export async function healthcheck() {
  if (!isDbConfigured) return false;
  try {
    const result = await sql`select 1 as ok`;
    return (result as any)?.[0]?.ok === 1;
  } catch {
    return false;
  }
}
