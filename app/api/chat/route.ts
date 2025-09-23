import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from "ai";
import { z } from "zod";
import { SYSTEM_PROMPTS } from "@/lib/ai/system-prompts";
import { getExa } from "@/lib/ai/exa";
import {
  ALLOWED_TABLES,
  ensureSelectAllowed,
  queryTableRowCount,
  queryViolationStats,
  queryTableSchema,
  SqlToolError,
} from "@/lib/ai/sql-tools";
import { getViolationSummary } from "@/lib/data/violations";
import { sql } from "@/lib/db";
import { dataApiGet } from "@/lib/data-api";
import { getNeonMCPTools } from "@/lib/mcp/neon";

export const maxDuration = 30;
export const runtime = "nodejs";

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

  // Build local tools and merge MCP tools if available
  const mcp = await getNeonMCPTools().catch(() => null);
  const localTools = {
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
          const exa = getExa();
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
    dataApiSelect: tool({
      description:
        "Query the Neon Data API (PostgREST). Use PostgREST params: select, eq.*, order, limit, etc. Table must be allowed.",
      inputSchema: z.object({
        table: z.enum(ALLOWED_TABLES),
        select: z.string().optional().default("*"),
        params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
        limit: z.number().int().optional(),
        order: z.string().optional(),
      }),
      execute: async ({ table, select, params = {}, limit, order }) => {
        const qp: Record<string, any> = { select, ...(params || {}) };
        if (typeof limit === "number") qp.limit = String(limit);
        if (order) qp.order = order;
        const rows = await dataApiGet({ table, params: qp });
        return { rows };
      },
    }),
    runSqlSelect: tool({
      description:
        "Execute a single SELECT (or WITH ...) query against allowed tables only. Use for analytics and listing.",
      inputSchema: z.object({
        statement: z.string().min(1).describe("A single SELECT/CTE statement limited to allowed tables"),
      }),
      execute: async ({ statement }) => {
        try {
          ensureSelectAllowed(statement);
          const rows = await (sql as any).unsafe(statement);
          return { rows };
        } catch (error) {
          if (error instanceof SqlToolError) {
            return { error: error.message };
          }
          throw error;
        }
      },
    }),
    describeTable: tool({
      description: "Describe the schema of an allowed table (public schema only).",
      inputSchema: z.object({
        table: z.string().describe("Table name to describe (validated against allow-list)"),
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

  // Helpful aliases: listTables and runSql (read-only)
  const aliasTools: Record<string, any> = {
    listTables: tool({
      description: "List table names in the 'public' schema",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await (sql as any)`
          select table_name
          from information_schema.tables
          where table_schema = 'public'
          order by table_name
        `;
        return { tables: (rows as any[]).map((r: any) => r.table_name) };
      },
    }),
    runSql: tool({
      description: "Execute a read-only SQL statement (SELECT/CTE only).",
      inputSchema: z.object({ sql: z.string().describe("SQL to run (single SELECT/CTE)") }),
      execute: async ({ sql: statement }) => {
        try {
          ensureSelectAllowed(statement);
          const rows = await (sql as any).unsafe(statement);
          return { rows };
        } catch (error) {
          if (error instanceof SqlToolError) {
            return { error: error.message };
          }
          throw error;
        }
      },
    }),
  };

  const tools = { ...(localTools as Record<string, any>), ...aliasTools, ...(mcp?.tools || {}) };

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
