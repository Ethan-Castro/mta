import { NextRequest } from "next/server";
import { sql, isDbConfigured } from "@/lib/db";

function stripSqlComments(sqlText: string) {
  return sqlText.replace(/--.*?$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function ensureReadOnlySelect(sqlText: string): { ok: true; statement: string } | { ok: false; reason: string } {
  const withoutComments = stripSqlComments(sqlText);
  const trimmed = withoutComments.trim();
  if (!trimmed) return { ok: false, reason: "SQL statement required." };
  const single = trimmed.replace(/[;\s]+$/, "").trim();
  const lowered = single.toLowerCase();
  if (!lowered.startsWith("select") && !lowered.startsWith("with ")) {
    return { ok: false, reason: "Only SELECT/CTE statements are permitted." };
  }
  const forbidden = [
    "insert",
    "update",
    "delete",
    "drop",
    "truncate",
    "alter",
    "grant",
    "revoke",
    "comment",
    "create",
    "attach",
    "replace",
    "vacuum",
    "merge",
    "call",
    "execute",
  ];
  if (forbidden.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(lowered))) {
    return { ok: false, reason: "Statement contains forbidden keywords." };
  }
  if (single.includes(";")) return { ok: false, reason: "Only a single statement is permitted." };
  return { ok: true, statement: single };
}

function cors(headers: Headers) {
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
}

export async function OPTIONS() {
  const headers = new Headers();
  cors(headers);
  return new Response(null, { status: 204, headers });
}

export async function POST(req: NextRequest) {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  cors(headers);

  if (!isDbConfigured) {
    return new Response(JSON.stringify({ error: "Database is not configured. Set DATABASE_URL." }), { status: 500, headers });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers });
  }

  const statement: string | undefined = typeof body?.sql === "string" ? body.sql : undefined;
  if (!statement) {
    return new Response(JSON.stringify({ error: "Provide { sql: string } in request body." }), { status: 400, headers });
  }

  const check = ensureReadOnlySelect(statement);
  if (!check.ok) {
    return new Response(JSON.stringify({ error: check.reason }), { status: 400, headers });
  }

  try {
    const rows = await (sql as any).unsafe(check.statement);
    return new Response(JSON.stringify({ rows }), { status: 200, headers });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: String(error?.message || error) }), { status: 500, headers });
  }
}


