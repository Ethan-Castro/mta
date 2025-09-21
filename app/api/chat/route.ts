import { NextResponse } from "next/server";
import { comprehensiveAgent as agent } from "@/lib/agents/insightAgent";
import { addMessage, upsertConversation } from "@/lib/chat";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const rawMessages: any[] = Array.isArray(body?.messages) ? body.messages : [];
    const { conversationId: conversationIdInput, title }: { conversationId?: string; title?: string } = body || {};

    // Normalize messages to the shape expected by the Agent API
    const messages: any[] = rawMessages.map((m: any) => {
      if (m && Array.isArray(m.parts)) return m;
      if (m && typeof m.content === "string") {
        return { role: m.role, parts: [{ type: "text", text: m.content }] };
      }
      if (m && typeof m.text === "string") {
        return { role: m.role, parts: [{ type: "text", text: m.text }] };
      }
      return m;
    });

    const conversation = await upsertConversation(conversationIdInput ?? null, title ?? null);
    const conversationId = conversation.id;

    // Persist trailing user text message if present
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      const rawParts: any = (last as any).parts;
      const parts: any[] = Array.isArray(rawParts) ? rawParts : [];
      const userText = parts.filter((p: any) => p?.type === "text").map((p: any) => p.text ?? "").join(" ");
      if (userText) {
        await addMessage({ conversationId, role: "user", content: userText });
      }
    }

    const res = await agent.respond({ messages: messages as any });

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
