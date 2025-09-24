import { NextResponse } from "next/server";
import { getNeonMCPTools } from "@/lib/mcp/neon";

export const runtime = "nodejs";

export async function GET() {
  try {
    const mcp = await getNeonMCPTools().catch(() => null);
    const toolNames = mcp ? Object.keys(mcp.tools || {}) : [];
    const ok = toolNames.length > 0;
    // Attempt to close transports to avoid leaking connections in health checks
    try { await mcp?.closeAll(); } catch {}
    return NextResponse.json({ ok, tools: toolNames });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "mcp error" }, { status: 500 });
  }
}


