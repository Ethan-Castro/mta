import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from "ai";
import { z } from "zod";
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
import { getViolationSummary } from "@/lib/data/violations";

export const runtime = "nodejs";
export const maxDuration = 30;

const exa = new Exa(process.env.EXA_API_KEY);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const { messages = [], model, system }: { messages?: UIMessage[]; model?: string; system?: string } = body || {};

  const headerModel = req.headers.get("x-model") || undefined;
  let attachmentModel: string | undefined;
  try {
    const allParts = (messages || []).flatMap((m: any) => Array.isArray((m as any)?.parts) ? (m as any).parts : []);
    for (let i = allParts.length - 1; i >= 0; i--) {
      const p = allParts[i];
      if (p && p.type === "model" && typeof p.value === "string" && p.value) {
        attachmentModel = p.value;
        break;
      }
    }
  } catch {}


  // Require AI Gateway key to be provided by environment (no hardcoded fallback)

  // No MCP: tools are declared locally

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
    describeTable: tool({
      description: "Describe the schema of an allowed table (public schema only).",
      inputSchema: z.object({
        table: z.enum(ALLOWED_TABLES).describe("Table name to describe"),
      }),
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
    listAllowedTables: tool({
      description: "List database tables that the assistant is permitted to query.",
      inputSchema: z.object({}),
      execute: async () => ({ tables: ALLOWED_TABLES }),
    }),
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
    countTableRows: tool({
      description: "Count rows from allowed tables with optional filters.",
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
    getViolationsSummary: tool({
      description: "Fetch grouped violations and exempt counts per route per month",
      inputSchema: z.object({
        routeId: z.string().optional(),
        start: z.string().optional(),
        end: z.string().optional(),
        limit: z.number().optional().default(50000),
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
    model: headerModel ?? attachmentModel ?? (model || "openai/gpt-5-mini"),
    system: system || SYSTEM_PROMPTS.default,
    messages: convertToModelMessages(messages),
    toolChoice: "auto",
    stopWhen: stepCountIs(15),
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
