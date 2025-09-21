import { NextResponse } from "next/server";
import { generateText } from "ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { routeId, start, end, question } = body || {};
    const forwardedProto = req.headers.get("x-forwarded-proto") || "http";
    const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const origin = process.env.NEXT_PUBLIC_BASE_URL || `${forwardedProto}://${forwardedHost}`;
    const url = new URL("/api/violations/summary", origin);
    if (routeId) url.searchParams.set("routeId", routeId);
    if (start) url.searchParams.set("start", start);
    if (end) url.searchParams.set("end", end);

    let data: any = { rows: [] };
    try {
      const dataRes = await fetch(url.toString(), { cache: "no-store" });
      if (dataRes.ok) {
        data = await dataRes.json();
      }
    } catch {
      // ignore and keep empty data
    }

    const hasGatewayKey = !!process.env.AI_GATEWAY_API_KEY;
    if (hasGatewayKey) {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        system: "You are a transit analytics assistant. Be concise and quantitative.",
        prompt: question
          ? `Answer the user's question using available context. If needed, reference the data below. Question: ${question}\nData: ${JSON.stringify(data).slice(0, 8000)}`
          : `Summarize ACE violations for the selected window. Return 3 bullets with concrete numbers. Data: ${JSON.stringify(data).slice(0, 8000)}`,
      });
      return NextResponse.json({ ok: true, text });
    }

    // Fallback summary when no OpenAI key is configured
    const rows = (data?.rows || []) as Array<{ violations?: string; exempt_count?: string; bus_route_id?: string; date_trunc_ym?: string }>;
    const totalViolations = rows.reduce((a, r) => a + Number(r.violations || 0), 0);
    const totalExempt = rows.reduce((a, r) => a + Number(r.exempt_count || 0), 0);
    const routes = Array.from(new Set(rows.map((r) => r.bus_route_id).filter(Boolean)));
    const months = Array.from(new Set(rows.map((r) => r.date_trunc_ym).filter(Boolean))).sort();
    const share = totalViolations ? Math.round((totalExempt / totalViolations) * 1000) / 10 : 0;
    const fallbackText = [
      `- Violations observed: ${totalViolations.toLocaleString()} across ${routes.length} routes`,
      `- Exempt share: ${share}% (${totalExempt.toLocaleString()} exempt)`,
      months.length ? `- Coverage window: ${months[0]} → ${months[months.length - 1]}` : `- Coverage window: not available`,
    ].join("\n");
    return NextResponse.json({ ok: true, text: fallbackText });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

