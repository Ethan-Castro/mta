import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs, experimental_transcribe as transcribe } from "ai";
import { z } from "zod";
import { SYSTEM_PROMPTS } from "@/lib/ai/system-prompts";
import { buildAceTools } from "@/lib/ai/ace-tools";
import { getExa } from "@/lib/ai/exa";
import { elevenlabs } from "@ai-sdk/elevenlabs";
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
import { stackServerApp } from "@/stack/server";

export const maxDuration = 30;
export const runtime = "nodejs";

export async function POST(req: Request) {
  const currentUser = await stackServerApp.getUser({ tokenStore: req, or: "return-null" });

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
  let authHeader = req.headers.get("authorization") || undefined;
  if (!authHeader && currentUser) {
    try {
      const authJson = await currentUser.getAuthJson();
      if (authJson?.accessToken) {
        authHeader = `Bearer ${authJson.accessToken}`;
      }
    } catch {}
  }
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
        const rows = await dataApiGet({
          table,
          params: qp,
          headers: authHeader ? { Authorization: authHeader } : {},
        });
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
          return await queryTableRowCount({
            table,
            year,
            start,
            end,
            dateColumn,
            headers: authHeader ? { Authorization: authHeader } : undefined,
          });
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
          return await queryViolationStats({
            routeId,
            year,
            start,
            end,
            headers: authHeader ? { Authorization: authHeader } : undefined,
          });
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
    visualize: tool({
      description:
        "Render a simple chart UI from provided data. Supports 'line', 'grouped-bar', 'bar', and 'pie'. Typically call an MCP SQL tool first, then pass rows here.",
      inputSchema: z.object({
        spec: z.object({
          type: z.enum(["line", "grouped-bar", "bar", "pie"]),
          title: z.string().optional(),
          yLabel: z.string().optional(),
        }),
        data: z.union([
          z.array(z.record(z.any())),
          z.object({ rows: z.array(z.record(z.any())) })
        ]),
      }),
      execute: async ({ spec, data }) => {
        const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : (data as any);
        if (spec.type === "line") {
          const points = Array.isArray(rows)
            ? rows.map((d: any) => ({ label: String(d.label ?? d.name ?? d.date_trunc_ym ?? ""), value: Number(d.value ?? d.violations ?? 0) }))
            : [];
          return { chart: spec, data: points };
        }
        if (spec.type === "grouped-bar") {
          const out = Array.isArray(rows)
            ? rows.map((d: any) => ({
                name: String(d.name ?? d.label ?? d.date_trunc_ym ?? ""),
                violations: Number(d.violations ?? d.value ?? 0),
                exempt: Number(d.exempt ?? d.exempt_count ?? 0),
              }))
            : [];
          return { chart: spec, data: out };
        }
        if (spec.type === "bar") {
          const out = Array.isArray(rows)
            ? rows.map((d: any) => ({ label: String(d.label ?? d.name ?? ""), value: Number(d.value ?? d.count ?? 0) }))
            : [];
          return { chart: spec, data: out };
        }
        if (spec.type === "pie") {
          const out = Array.isArray(rows)
            ? rows.map((d: any) => ({ label: String(d.label ?? d.name ?? ""), value: Number(d.value ?? d.count ?? 0) }))
            : [];
          return { chart: spec, data: out };
        }
        return { error: "Unsupported chart type" };
      },
    }),
    transcribeAudio: tool({
      description: "Transcribe audio files to text using ElevenLabs speech-to-text",
      inputSchema: z.object({
        audio: z.string().describe("Base64 encoded audio data or audio file URL"),
        languageCode: z.string().optional().describe("ISO-639-1 language code (e.g., 'en')"),
        tagAudioEvents: z.boolean().optional().default(true).describe("Whether to tag audio events like (laughter)"),
        numSpeakers: z.number().int().optional().describe("Maximum number of speakers (up to 32)"),
        timestampsGranularity: z.enum(["none", "word", "character"]).optional().default("word").describe("Granularity of timestamps"),
        diarize: z.boolean().optional().default(true).describe("Whether to identify speakers"),
      }),
      execute: async ({ audio, languageCode, tagAudioEvents, numSpeakers, timestampsGranularity, diarize }) => {
        if (!process.env.ELEVENLABS_API_KEY) {
          return { error: "ELEVENLABS_API_KEY is not configured." };
        }
        try {
          // Convert base64 to Uint8Array if needed
          let audioData: Uint8Array;
          if (audio.startsWith('data:')) {
            const base64Data = audio.split(',')[1];
            const binaryString = atob(base64Data);
            audioData = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              audioData[i] = binaryString.charCodeAt(i);
            }
          } else if (audio.startsWith('http')) {
            // Handle URL - fetch the audio file
            const response = await fetch(audio);
            if (!response.ok) {
              return { error: "Failed to fetch audio from URL" };
            }
            const arrayBuffer = await response.arrayBuffer();
            audioData = new Uint8Array(arrayBuffer);
          } else {
            // Assume it's base64 without data URL prefix
            const binaryString = atob(audio);
            audioData = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              audioData[i] = binaryString.charCodeAt(i);
            }
          }

          const result = await transcribe({
            model: elevenlabs.transcription('scribe_v1'),
            audio: audioData,
            providerOptions: { 
              elevenlabs: { 
                ...(languageCode && { languageCode }),
                ...(tagAudioEvents !== undefined && { tagAudioEvents }),
                ...(numSpeakers && { numSpeakers }),
                ...(timestampsGranularity && { timestampsGranularity }),
                ...(diarize !== undefined && { diarize })
              } 
            },
          });

          return {
            text: result.text,
            segments: result.segments || [],
            language: result.language || languageCode || 'auto-detected'
          };
        } catch (error: any) {
          return { error: error?.message || "Transcription failed" };
        }
      },
    }),
    artifact: tool({
      description: "Create a structured document artifact with title, description, content, and actions. Use this to present formatted documents, reports, or any structured content in the chat.",
      inputSchema: z.object({
        title: z.string().min(1).describe("The main title of the artifact"),
        description: z.string().optional().describe("Optional description or subtitle for the artifact"),
        content: z.string().min(1).describe("The main content of the artifact (can include markdown)"),
        actions: z.array(z.object({
          label: z.string().min(1).describe("Label for the action button"),
          tooltip: z.string().optional().describe("Tooltip text for the action"),
          icon: z.string().optional().describe("Icon name (e.g., 'copy', 'download', 'edit')"),
        })).optional().describe("Optional array of action buttons"),
      }),
      execute: async ({ title, description, content, actions }) => {
        return {
          artifact: {
            title,
            description,
            content,
            actions: actions || [],
          },
        };
      },
    }),
  } as const;

  // Helpful alias: listTables (read-only)
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
  };

  const aceTools = await buildAceTools();

  const tools = {
    ...(localTools as Record<string, any>),
    ...aliasTools,
    ...aceTools,
    ...(mcp?.tools || {}),
  } as Record<string, any>;
  if (mcp?.tools?.run_sql) tools.runSql = mcp.tools.run_sql;
  if (mcp?.tools?.run_sql_transaction) tools.runSqlTransaction = mcp.tools.run_sql_transaction;

  const alias = (from: string, to: string) => {
    if (!(from in tools) && to in tools) {
      tools[from] = tools[to];
      try {
        if ((tools as any)[to]?.__origin && !(tools as any)[from]?.__origin) {
          (tools as any)[from].__origin = (tools as any)[to].__origin;
        }
      } catch {}
    }
  };

  alias("list_tables", "listTables");
  alias("describe_table", "describeTable");
  alias("forecast_route", "forecastRoute");
  alias("risk_top", "riskTop");
  alias("risk_score", "riskScore");
  alias("hotspots_map", "hotspotsMap");
  alias("survival_km", "survivalKm");
  alias("survival_cox", "survivalCox");

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
