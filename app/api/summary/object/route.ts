import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";

export const runtime = "nodejs";

const SummarySchema = z.object({
  highlights: z.array(z.string().min(4)).max(5),
  kpis: z.object({
    violations: z.number().optional(),
    exemptShare: z.number().optional(),
    speedDeltaPct: z.number().optional(),
  }),
  recommendations: z.array(z.string()).max(3),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { data } = body || {};

    // Require the Vercel AI Gateway key to be provided at runtime (no hard-coded fallback)
    if (!process.env.AI_GATEWAY_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "AI_GATEWAY_API_KEY must be set in the environment." },
        { status: 500 }
      );
    }

    const { object } = await generateObject({
      model: "openai/gpt-5-mini",
      schema: SummarySchema,
      system: "Extract concise KPIs and recommendations from ACE analytics.",
      prompt: `Summarize and structure this data for executives: ${JSON.stringify(data).slice(0, 8000)}`,
    });
    return NextResponse.json({ ok: true, object });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

