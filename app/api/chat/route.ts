import { NextResponse } from "next/server";
import { insightAgent, InsightAgentUIMessage } from "@/lib/agents/insightAgent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { messages }: { messages: InsightAgentUIMessage[] } = await req.json();
    return insightAgent.respond({ messages });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
