import { NextResponse } from "next/server";
import { dataApiGet } from "@/lib/data-api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const hasToken = Boolean(process.env.NEON_DATA_API_TOKEN || process.env.NEON_DATA_API_KEY);
    if (!hasToken) {
      return NextResponse.json({ ok: true, skipped: true, reason: "missing NEON_DATA_API_TOKEN" });
    }
    const auth = req.headers.get("authorization") || undefined;
    // Try a lightweight probe; fall back to a tiny aggregation from an allowed table
    const probe = await dataApiGet<any[]>({
      table: "violations",
      params: { select: "count:count()", limit: 1 },
      headers: auth ? { Authorization: auth } : {},
    });
    return NextResponse.json({ ok: true, probe: Array.isArray(probe) ? probe.slice(0, 1) : null });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "data api error" },
      { status: 500 }
    );
  }
}


