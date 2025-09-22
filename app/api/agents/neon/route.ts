import { NextResponse } from "next/server";
import { getNeonAgent } from "@/lib/agents/neonAgent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const { prompt, messages: rawMessages, maxSteps, includeMcp, allowDestructive } = body || {};

    const messages: any[] = Array.isArray(rawMessages)
      ? rawMessages
      : prompt
      ? [{ role: "user", parts: [{ type: "text", text: String(prompt) }] }]
      : [];

    if (!messages.length) {
      return NextResponse.json({ ok: false, error: "Provide prompt or messages[]" }, { status: 400 });
    }

    const { agent /*, close*/ } = await getNeonAgent({
      maxSteps: typeof maxSteps === "number" ? maxSteps : undefined,
      includeMcp: includeMcp !== false,
      allowDestructive: !!allowDestructive,
    });

    const res = await agent.respond({ messages: messages as any });

    return new NextResponse(res.body, {
      headers: Object.fromEntries((res.headers as any)?.entries?.() ?? []),
      status: res.status,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}


