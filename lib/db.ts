import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add your Neon connection string to the environment.");
}

export const sql = neon(connectionString);

export async function healthcheck() {
  const result = await sql`select 1 as ok`;
  return result?.[0]?.ok === 1;
}
