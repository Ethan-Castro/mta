import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { addMessage, upsertConversation } from "@/lib/chat";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model, conversationId: conversationIdInput, title }: { messages: UIMessage[]; model?: string; conversationId?: string; title?: string } =
    await req.json();

  const headerConversation = req.headers.get("x-conversation-id") || undefined;
  const conversation = await upsertConversation(conversationIdInput ?? headerConversation ?? null, title ?? null);
  const conversationId = conversation.id;

  // Persist last user message (if any)
  const last = messages[messages.length - 1];
  if (last && last.role === "user") {
    const parts: any[] = (last as any).parts ?? [];
    const userText = parts
      .filter((p) => p?.type === "text" && typeof p.text === "string")
      .map((p) => p.text)
      .join(" ");
    if (userText) {
      await addMessage({ conversationId, role: "user", content: userText });
    }
  }

  // Ensure Vercel AI Gateway key is available for the default Gateway provider
  process.env.AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || "vck_71Q1WAPSF8Hxrgs9wXw0k8sdl8oHndAnZch694sGbRkTa7aHuT46f1oo";

  const result = streamText({
    model: model ?? "openai/gpt-5",
    messages: convertToModelMessages(messages),
  });
  const response = result.toUIMessageStreamResponse();
  return new Response(response.body, {
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      "x-conversation-id": conversationId,
    },
    status: response.status,
  });
}


