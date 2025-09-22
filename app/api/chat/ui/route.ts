import { streamText, type UIMessage, convertToModelMessages, tool, stepCountIs } from "ai";
import { z } from "zod";
import { addMessage, upsertConversation } from "@/lib/chat";
import { getViolationSummary } from "@/lib/data/violations";
import { sql } from "@/lib/db";
import { SYSTEM_PROMPTS } from "@/lib/ai/system-prompts";
import Exa from "exa-js";
import {
  ALLOWED_TABLES,
  ensureSelectAllowed,
  queryTableRowCount,
  queryViolationStats,
  queryTableSchema,
  SqlToolError,
} from "@/lib/ai/sql-tools";

export const runtime = "nodejs";
export const maxDuration = 30;

const exa = new Exa(process.env.EXA_API_KEY);

export async function POST(req: Request) {
  const { messages, model, conversationId: conversationIdInput, title }: { messages: UIMessage[]; model?: string; conversationId?: string; title?: string } =
    await req.json();

  const headerModel = req.headers.get("x-model") || undefined;
  let attachmentModel: string | undefined;
  try {
    const allParts = (messages || []).flatMap((m: any) => Array.isArray(m?.parts) ? m.parts : []);
    for (let i = allParts.length - 1; i >= 0; i--) {
      const p = allParts[i];
      if (p && p.type === "model" && typeof p.value === "string" && p.value) {
        attachmentModel = p.value;
        break;
      }
    }
  } catch {}

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

  // Require AI Gateway key to be provided by environment (no hardcoded fallback)

  // No MCP: tools are defined locally below

  const tools = {
    webSearch: tool({
      description: "Search the web for up-to-date information",
      inputSchema: z.object({
        query: z.string().min(1).max(200).describe("The search query"),
      }),
      execute: async ({ query }) => {
        if (!process.env.EXA_API_KEY) {
          return { error: "EXA_API_KEY is not configured." };
        }
        try {
          const { results } = await exa.searchAndContents(query, {
            type: "auto",
            text: true,
            livecrawl: "always",
            numResults: 20,
          } as any);
          return results.map((result: any) => ({
            title: result.title,
            url: result.url,
            content: String(result.text || "").slice(0, 1000),
            publishedDate: result.publishedDate ?? result.published ?? null,
          }));
        } catch (error: any) {
          return { error: error?.message || "Web search failed" };
        }
      },
    }),
    listAllowedTables: tool({
      description: "List database tables that the assistant is permitted to query.",
      inputSchema: z.object({}),
      execute: async () => ({ tables: ALLOWED_TABLES }),
    }),
    describeTable: tool({
      description: "Describe the schema of an allowed table (public schema only).",
      inputSchema: z.object({ table: z.enum(ALLOWED_TABLES) }),
      execute: async ({ table }) => {
        try {
          return await queryTableSchema({ table });
        } catch (error) {
          if (error instanceof SqlToolError) {
            return { error: error.message };
          }
          throw error;
        }
      },
    }),
    countTableRows: tool({
      description: "Count rows from allowed tables with optional time filters.",
      inputSchema: z.object({
        table: z.enum(ALLOWED_TABLES),
        year: z.number().int().optional(),
        start: z.string().optional(),
        end: z.string().optional(),
        dateColumn: z.string().optional(),
      }),
      execute: async ({ table, year, start, end, dateColumn }) => {
        try {
          return await queryTableRowCount({ table, year, start, end, dateColumn });
        } catch (error) {
          if (error instanceof SqlToolError) {
            return { error: error.message };
          }
          throw error;
        }
      },
    }),
    getViolationsSummary: tool({
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
    }),
    violationTotals: tool({
      description: "Aggregate violation totals (overall and exempt) with optional filters.",
      inputSchema: z.object({
        routeId: z.string().optional(),
        year: z.number().int().optional(),
        start: z.string().optional(),
        end: z.string().optional(),
      }),
      execute: async ({ routeId, year, start, end }) => {
        try {
          return await queryViolationStats({ routeId, year, start, end });
        } catch (error) {
          if (error instanceof SqlToolError) {
            return { error: error.message };
          }
          throw error;
        }
      },
    }),
    chartViolationsTrend: tool({
      description: "Return a line chart spec for monthly violations for given route(s) and window.",
      inputSchema: z.object({
        routeId: z.string().optional(),
        start: z.string().optional(),
        end: z.string().optional(),
        limit: z.number().optional().default(50000),
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
    }),
    chartViolationsGrouped: tool({
      description: "Return grouped-bar chart spec of monthly violations vs exempt counts.",
      inputSchema: z.object({
        routeId: z.string().optional(),
        start: z.string().optional(),
        end: z.string().optional(),
        limit: z.number().optional().default(50000),
      }),
      execute: async ({ routeId, start, end, limit }) => {
        const rows = await getViolationSummary({ routeId, start, end, limit });
        const monthMap = new Map<string, { violations: number; exempt: number }>();
        for (const r of rows) {
          const key = r.month;
          const agg = monthMap.get(key) || { violations: 0, exempt: 0 };
          agg.violations += Number(r.violations || 0);
          agg.exempt += Number(r.exemptCount || 0);
          monthMap.set(key, agg);
        }
        const data = Array.from(monthMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, v]) => ({ name: month, violations: v.violations, exempt: v.exempt }));
        return {
          chart: { type: "grouped-bar", title: "Monthly violations vs exempt", yLabel: "Count" },
          data,
        };
      },
    }),
  } as const;

  const result = streamText({
    model: headerModel ?? attachmentModel ?? model ?? "openai/gpt-5-mini",
    system: SYSTEM_PROMPTS.streaming,
    messages: convertToModelMessages(messages),
    tools,
    toolChoice: "auto",
    stopWhen: stepCountIs(15),
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
