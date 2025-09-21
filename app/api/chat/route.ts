import { NextResponse } from "next/server";
import { comprehensiveAgent as agent } from "@/lib/agents/insightAgent";
import { addMessage, upsertConversation } from "@/lib/chat";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { messages, conversationId: conversationIdInput, title }: { messages: any[]; conversationId?: string; title?: string } = await req.json();

    const conversation = await upsertConversation(conversationIdInput ?? null, title ?? null);
    const conversationId = conversation.id;

    // Persist trailing user text message if present
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      const parts: any[] = last.parts ?? [];
      const userText = parts.filter((p) => p?.type === "text").map((p) => p.text ?? "").join(" ");
      if (userText) {
        await addMessage({ conversationId, role: "user", content: userText });
      }
    }

    const res = await agent.respond({ messages });

    // Best-effort: capture AI text chunks from result if available
    // Best-effort persistence will be handled by UI route during streaming

    // Attach conversation id header
    return new NextResponse(res.body, {
      headers: {
        ...Object.fromEntries((res.headers as any)?.entries?.() ?? []),
        "x-conversation-id": conversationId,
      },
      status: res.status,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
