import { streamText, type UIMessage, convertToModelMessages, tool, stepCountIs } from "ai";
import { z } from "zod";
import { addMessage, upsertConversation } from "@/lib/chat";
import { getViolationSummary } from "@/lib/data/violations";
import { sql } from "@/lib/db";
import { SYSTEM_PROMPTS } from "@/lib/ai/system-prompts";
import { buildAceTools } from "@/lib/ai/ace-tools";
import { getExa } from "@/lib/ai/exa";
import {
  ALLOWED_TABLES,
  ensureSelectAllowed,
  queryTableRowCount,
  queryViolationStats,
  queryTableSchema,
  SqlToolError,
} from "@/lib/ai/sql-tools";
import { dataApiGet } from "@/lib/data-api";
import { getNeonMCPTools } from "@/lib/mcp/neon";
import { stackServerApp } from "@/stack/server";
import {
  BRAND_PRIMARY_HEX,
  BRAND_SUCCESS_HEX,
  BRAND_ERROR_HEX,
  BRAND_WARNING_HEX,
  BRAND_PURPLE_HEX,
  BRAND_INFO_HEX,
} from "@/lib/ui/colors";

export const maxDuration = 30;
export const runtime = "nodejs";

export async function POST(req: Request) {
  const currentUser = await stackServerApp.getUser({ tokenStore: req, or: "return-null" });

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

  // Try to attach Neon MCP tools (best-effort)
  const mcp = await getNeonMCPTools().catch(() => null);

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

  // Build local tools; merge MCP tools if available
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
    listAllowedTables: tool({
      description: "List database tables that the assistant is permitted to query.",
      inputSchema: z.object({}),
      execute: async () => ({ tables: ALLOWED_TABLES }),
    }),
    describeTable: tool({
      description: "Describe the schema of an allowed table (public schema only).",
      inputSchema: z.object({ table: z.string().describe("Table name (validated against allow-list)") }),
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
        "Render a simple chart UI from provided data. Supports 'line', 'multi-line', 'grouped-bar', 'bar', and 'pie'. Typically call an MCP SQL tool first, then pass rows here.",
      inputSchema: z.object({
        spec: z.object({
          type: z.enum(["line", "multi-line", "grouped-bar", "bar", "pie"]),
          title: z.string().optional(),
          yLabel: z.string().optional(),
          series: z.array(z.string()).optional(),
          xKey: z.string().optional(),
          yKey: z.string().optional(),
          aceRoute: z.string().optional(),
          markerLabel: z.string().optional(),
          marker: z.object({ x: z.string(), label: z.string().optional() }).optional(),
        }),
        data: z.union([
          z.array(z.record(z.any())),
          z.object({ rows: z.array(z.record(z.any())) }),
        ]),
      }),
      execute: async ({ spec, data }) => {
        const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : (data as any);
        if (spec.type === "multi-line") {
          const xKey: string = (spec as any).xKey || "week_start";
          const yKey: string = (spec as any).yKey || "avg_mph";
          const routeKey = "route_id";
          const aceKey = "ace_go_live";
          const inputRows: any[] = Array.isArray(rows) ? rows : [];
          const routeSet = new Set<string>(
            Array.isArray((spec as any).series) && (spec as any).series.length
              ? (spec as any).series
              : inputRows
                  .map((r) => String(r?.[routeKey] ?? ""))
                  .filter((v) => Boolean(v))
          );
          const series = Array.from(routeSet);
          const byX = new Map<string, Record<string, number | string>>();
          let aceDate: string | null = null;
          const aceRoute = (spec as any).aceRoute || (series.length ? series[0] : null);
          for (const r of inputRows) {
            const xRaw = r?.[xKey];
            if (!xRaw) continue;
            const label = typeof xRaw === "string" ? xRaw.slice(0, 10) : new Date(xRaw).toISOString().slice(0, 10);
            const route = String(r?.[routeKey] ?? "");
            if (!route) continue;
            const valueNum = Number(r?.[yKey] ?? 0);
            const point = byX.get(label) ?? { label };
            (point as any)[route] = Number.isFinite(valueNum) ? valueNum : 0;
            byX.set(label, point);
            if (!aceDate && aceRoute && route === aceRoute) {
              const a = r?.[aceKey];
              if (a) {
                aceDate = typeof a === "string" ? a.slice(0, 10) : new Date(a).toISOString().slice(0, 10);
              }
            }
          }
          const points = Array.from(byX.entries())
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([, v]) => v as { label: string; [k: string]: number | string });
          const marker = (spec as any).marker || (aceDate
            ? { x: aceDate, label: (spec as any).markerLabel || (aceRoute ? `ACE go-live: ${aceRoute} (${aceDate})` : `ACE go-live (${aceDate})`) }
            : undefined);
          return { chart: { type: "multi-line", series, yLabel: (spec as any).yLabel || "Average speed (mph)", marker }, data: points };
        }
        if (spec.type === "line") {
          const xKey: string | undefined = (spec as any).xKey;
          const yKey: string | undefined = (spec as any).yKey;
          const points = Array.isArray(rows)
            ? rows.map((d: any) => {
                const rawLabel = xKey ? d?.[xKey] : (d?.label ?? d?.name ?? d?.date_trunc_ym);
                const label = typeof rawLabel === "string" ? rawLabel : rawLabel ? new Date(rawLabel).toISOString().slice(0, 10) : "";
                const valueSource = yKey ? d?.[yKey] : (d?.value ?? d?.violations ?? d?.avg_mph ?? d?.count);
                const value = Number(valueSource ?? 0);
                return { label: String(label), value: Number.isFinite(value) ? value : 0 };
              })
            : [];
          return { chart: spec, data: points };
        }
        if (spec.type === "grouped-bar") {
          const out = Array.isArray(rows)
            ? rows.map((d: any) => ({
                name: String((spec as any).xKey ? d?.[(spec as any).xKey] : (d.name ?? d.label ?? d.date_trunc_ym) ?? ""),
                violations: Number(d.violations ?? d.value ?? 0),
                exempt: Number(d.exempt ?? d.exempt_count ?? 0),
              }))
            : [];
          return { chart: spec, data: out };
        }
        if (spec.type === "bar") {
          const xKey: string | undefined = (spec as any).xKey;
          const yKey: string | undefined = (spec as any).yKey;
          const out = Array.isArray(rows)
            ? rows.map((d: any) => ({
                label: String((xKey ? d?.[xKey] : (d.label ?? d.name)) ?? ""),
                value: Number((yKey ? d?.[yKey] : (d.value ?? d.count ?? d.avg_mph)) ?? 0),
              }))
            : [];
          return { chart: spec, data: out };
        }
        if (spec.type === "pie") {
          const xKey: string | undefined = (spec as any).xKey;
          const yKey: string | undefined = (spec as any).yKey;
          const out = Array.isArray(rows)
            ? rows.map((d: any) => ({
                label: String((xKey ? d?.[xKey] : (d.label ?? d.name)) ?? ""),
                value: Number((yKey ? d?.[yKey] : (d.value ?? d.count ?? d.avg_mph)) ?? 0),
              }))
            : [];
          return { chart: spec, data: out };
        }
        return { error: "Unsupported chart type" };
      },
    }),
    createMap: tool({
      description:
        "Create an interactive Mapbox map from tabular data. Provide latitude/longitude keys and optional title/description/color/href keys.",
      inputSchema: z.object({
        spec: z.object({
          type: z.literal("map"),
          title: z.string().optional(),
          center: z.array(z.number()).length(2).optional().describe("[lng, lat]"),
          zoom: z.number().min(1).max(20).optional(),
          cluster: z.boolean().optional(),
        }),
        data: z.union([
          z.array(z.record(z.any())),
          z.object({ rows: z.array(z.record(z.any())) }),
        ]),
        config: z.object({
          latitudeKey: z.string(),
          longitudeKey: z.string(),
          titleKey: z.string().optional(),
          descriptionKey: z.string().optional(),
          colorKey: z.string().optional(),
          hrefKey: z.string().optional(),
        }),
      }),
      execute: async ({ spec, data, config }) => {
        const rows: any[] = Array.isArray((data as any)?.rows) ? (data as any).rows : (Array.isArray(data) ? data : []);
        if (!Array.isArray(rows) || rows.length === 0) {
          return { error: "No data provided for map" };
        }
          function colorFromValue(value: unknown): string {
            if (typeof value === "number" && Number.isFinite(value)) {
              if (value < 10) return BRAND_SUCCESS_HEX;
              if (value < 50) return BRAND_WARNING_HEX;
              return BRAND_ERROR_HEX;
            }
            if (value == null) return BRAND_PRIMARY_HEX;
            const s = String(value);
            let hash = 0;
            for (let i = 0; i < s.length; i++) hash = (hash << 5) - hash + s.charCodeAt(i);
            const palette = [
              BRAND_PRIMARY_HEX,
              BRAND_SUCCESS_HEX,
              BRAND_WARNING_HEX,
              BRAND_ERROR_HEX,
              BRAND_PURPLE_HEX,
              BRAND_INFO_HEX,
            ];
            return palette[Math.abs(hash) % palette.length];
          }
        const markers = rows
          .map((row: any, index: number) => {
            const lat = Number(row?.[config.latitudeKey]);
            const lng = Number(row?.[config.longitudeKey]);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            const title = config.titleKey ? String(row?.[config.titleKey] ?? "") : `Point ${index + 1}`;
            const description = config.descriptionKey ? String(row?.[config.descriptionKey] ?? "") : "";
            const href = config.hrefKey ? String(row?.[config.hrefKey] ?? "") : undefined;
            const color = config.colorKey ? colorFromValue(row?.[config.colorKey]) : BRAND_PRIMARY_HEX;
            return { id: `m-${index}`, latitude: lat, longitude: lng, title, description, href, color };
          })
          .filter(Boolean) as Array<{ id: string; latitude: number; longitude: number; title?: string; description?: string; href?: string; color?: string; }>;
        if (!markers.length) return { error: "No valid coordinates found in data" };
        let center: [number, number] | undefined = (spec as any).center as any;
        if (!center) {
          const avgLat = markers.reduce((s, m) => s + m.latitude, 0) / markers.length;
          const avgLng = markers.reduce((s, m) => s + m.longitude, 0) / markers.length;
          center = [avgLng, avgLat];
        }
        return {
          chart: {
            type: "map",
            title: (spec as any).title,
            center,
            zoom: (spec as any).zoom ?? 10,
            cluster: (spec as any).cluster ?? true,
          },
          data: markers,
        };
      },
    }),
  } as const;

  const aliasTools = {
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
  } as const;

  const aceTools = await buildAceTools();
  const tools = { ...localTools, ...aliasTools, ...aceTools, ...(mcp?.tools || {}) } as Record<string, any>;
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
