import { NextResponse } from "next/server";
import { z } from "zod";
import { insightAgent } from "@/lib/agents/insightAgent";

const BodySchema = z.object({
  routeId: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parse = BodySchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ ok: false, error: parse.error.flatten() }, { status: 400 });
    }
    const { routeId, start, end } = parse.data;

    const promptParts = [
      `Provide an executive-ready summary of ACE violations using Neon data.`,
      `Focus on quantitative insights, exempt share, and recommended actions.`,
    ];
    if (routeId) promptParts.push(`Focus on route ${routeId}.`);
    if (start || end) {
      promptParts.push(`Use the date window ${start ?? "(start)"} to ${end ?? "(end)"}.`);
    }
    promptParts.push(`Call the relevant tools to gather metrics before responding.`);

    const result = await insightAgent.generate({ prompt: promptParts.join(" ") });

    return NextResponse.json({ ok: true, text: result.text });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Failed to run agent" }, { status: 500 });
  }
}
