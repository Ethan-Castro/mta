import { NextResponse } from "next/server";
import { healthcheck as dbHealth } from "@/lib/db";
import { dataApiGet } from "@/lib/data-api";
import { getNeonMCPTools } from "@/lib/mcp/neon";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const results = {
    db: { ok: false as boolean, error: undefined as string | undefined },
    dataApi: { ok: false as boolean, error: undefined as string | undefined },
    mcp: { ok: false as boolean, error: undefined as string | undefined },
  };

  // DB health
  try {
    results.db.ok = await dbHealth();
  } catch (e: any) {
    results.db = { ok: false, error: e?.message || "db error" };
  }

  // Data API health
  try {
    const hasToken = Boolean(process.env.NEON_DATA_API_TOKEN || process.env.NEON_DATA_API_KEY);
    if (hasToken) {
      const auth = req.headers.get("authorization") || undefined;
      const probe = await dataApiGet<any[]>({
        table: "violations",
        params: { select: "count:count()", limit: 1 },
        headers: auth ? { Authorization: auth } : {},
      });
      results.dataApi.ok = Array.isArray(probe);
    } else {
      results.dataApi.ok = true;
      results.dataApi.error = "skipped: missing NEON_DATA_API_TOKEN";
    }
  } catch (e: any) {
    results.dataApi = { ok: false, error: e?.message || "data api error" };
  }

  // MCP health
  try {
    const mcp = await getNeonMCPTools().catch(() => null);
    const toolNames = mcp ? Object.keys(mcp.tools || {}) : [];
    results.mcp.ok = toolNames.length > 0;
    try { await mcp?.closeAll(); } catch {}
  } catch (e: any) {
    results.mcp = { ok: false, error: e?.message || "mcp error" };
  }

  const status = results.db.ok && results.dataApi.ok && results.mcp.ok ? 200 : 500;
  return NextResponse.json(results, { status });
}


