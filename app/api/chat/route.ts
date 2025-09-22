import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from "ai";
import { z } from "zod";
import { SYSTEM_PROMPTS } from "@/lib/ai/system-prompts";
import { getNeonMCPTools } from "@/lib/mcp/neon";
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const { messages = [], model, system }: { messages?: UIMessage[]; model?: string; system?: string } = body || {};


  // Load Neon MCP tools (allowed set only). Best-effort; continue without if unavailable
  let mcpBundle: Awaited<ReturnType<typeof getNeonMCPTools>> | null = null;
  try {
    mcpBundle = await getNeonMCPTools();
  } catch {}

  // Load Composio Exa tools with Vercel provider
  // Uses COMPOSIO_API_KEY and a server-generated user id (per-session).
  let composioTools: Record<string, any> = {};
  try {
    const userId = (crypto.randomUUID && crypto.randomUUID()) || Math.random().toString(36).slice(2);
    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY, provider: new VercelProvider() });
    // Fetch only EXA toolkit for web search
    composioTools = await composio.tools.get(userId, { toolkits: ["EXA"] });
  } catch {}

  const tools = {
    weather: tool({
      description: "Get the weather in a location (fahrenheit)",
      inputSchema: z.object({
        location: z.string().describe("The location to get the weather for"),
      }),
      execute: async ({ location }) => {
        const temperature = Math.round(Math.random() * (90 - 32) + 32);
        return { location, temperature };
      },
    }),
    convertFahrenheitToCelsius: tool({
      description: "Convert a temperature in fahrenheit to celsius",
      inputSchema: z.object({
        temperature: z.number().describe("The temperature in fahrenheit to convert"),
      }),
      execute: async ({ temperature }) => {
        const celsius = Math.round((temperature - 32) * (5 / 9));
        return { celsius };
      },
    }),
    ...(mcpBundle?.tools ?? {}),
    ...(composioTools ?? {}),
  } as const;

  const result = streamText({
    model: model || "openai/gpt-5",
    system: system || SYSTEM_PROMPTS.default,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    onError({ error }) {
      console.error("/api/chat stream error:", error);
    },
    onStepFinish({ toolCalls, toolResults }) {
      if (toolCalls?.length) {
        console.debug("Tool calls:", toolCalls.map((c) => ({ name: c.toolName, input: c.input })));
      }
      if (toolResults?.length) {
        console.debug(
          "Tool results:",
          toolResults.map((r) => ({ name: r.toolName, output: r.output }))
        );
      }
    },
    tools,
  });

  return result.toUIMessageStreamResponse();
}
