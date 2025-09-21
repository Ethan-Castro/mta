import { streamText, type UIMessage, convertToModelMessages } from "ai";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model }: { messages: UIMessage[]; model?: string } =
    await req.json();

  // Ensure Vercel AI Gateway key is available for the default Gateway provider
  process.env.AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || "vck_71Q1WAPSF8Hxrgs9wXw0k8sdl8oHndAnZch694sGbRkTa7aHuT46f1oo";

  const result = streamText({
    model: model ?? "openai/gpt-5",
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}


