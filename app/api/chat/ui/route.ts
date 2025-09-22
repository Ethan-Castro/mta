import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { z } from "zod";
import { addMessage, upsertConversation } from "@/lib/chat";
import { getViolationSummary } from "@/lib/data/violations";
import { sql } from "@/lib/db";
import { getNeonMCPTools } from "@/lib/mcp/neon";
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

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

  // Ensure Vercel AI Gateway key is provided by environment only (no hardcoded fallback)

  // Load Neon MCP tools (allowed set only). Best-effort; continue without if unavailable
  let mcpBundle: Awaited<ReturnType<typeof getNeonMCPTools>> | null = null;
  try {
    mcpBundle = await getNeonMCPTools();
  } catch {}

  // Load Composio Exa tools with Vercel provider for web search
  let composioTools: Record<string, any> = {};
  try {
    const userId = (crypto.randomUUID && crypto.randomUUID()) || Math.random().toString(36).slice(2);
    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY, provider: new VercelProvider() });
    composioTools = await composio.tools.get(userId, { toolkits: ["EXA"] });
  } catch {}

  const tools = {
    runSql: {
      description: "Execute a SQL query against Neon Postgres (server-side only).",
      inputSchema: z.object({
        sql: z.string().describe("Parameterized SQL using Neon serverless tagged template is not supported; pass full SQL string."),
      }),
      execute: async ({ sql: raw }) => {
        // Basic guardrail: disallow dangerous statements in this demo
        const lowered = raw.trim().toLowerCase();
        const forbidden = ["drop ", "truncate ", "alter ", "grant ", "revoke "];
        if (forbidden.some((kw) => lowered.startsWith(kw))) {
          return { error: "Statement not allowed." };
        }
        const rows = await sql(raw as any);
        return { rows };
      },
    },
    getViolationsSummary: {
      description: "Fetch grouped violations and exempt counts per route per month",
      inputSchema: z.object({
        routeId: z.string().optional(),
        start: z.string().optional(),
        end: z.string().optional(),
        limit: z.number().optional().default(5000),
      }),
      execute: async ({ routeId, start, end, limit }) => {
        const rows = await getViolationSummary({ routeId, start, end, limit });
        return {
          rows: rows.map((row) => ({
            bus_route_id: row.busRouteId,
            date_trunc_ym: row.month,
            violations: row.violations,
            exempt_count: row.exemptCount,
          })),
        };
      },
    },
    chartViolationsTrend: {
      description: "Return a line chart spec for monthly violations for given route(s) and window.",
      inputSchema: z.object({
        routeId: z.string().optional(),
        start: z.string().optional(),
        end: z.string().optional(),
        limit: z.number().optional().default(5000),
      }),
      execute: async ({ routeId, start, end, limit }) => {
        const rows = await getViolationSummary({ routeId, start, end, limit });
        const data = rows
          .slice()
          .sort((a, b) => a.month.localeCompare(b.month))
          .map((r) => ({ label: r.month, value: r.violations }));
        return {
          chart: { type: "line", title: "Monthly violations", yLabel: "Violations" },
          data,
        };
      },
    },
    ...(mcpBundle?.tools ?? {}),
    ...(composioTools ?? {}),
  } as const;

  const result = streamText({
    model: model ?? "openai/gpt-5",
    messages: convertToModelMessages(messages),
    tools,
    toolChoice: "auto",
  });
  const uiResponse = result.toUIMessageStreamResponse();

  return new Response(uiResponse.body, {
    headers: {
      ...Object.fromEntries(uiResponse.headers.entries()),
      "x-conversation-id": conversationId,
    },
    status: uiResponse.status,
  });
}


