import { streamText, stepCountIs, experimental_transcribe as transcribe } from "ai";
import { SYSTEM_PROMPTS } from "@/lib/ai/system-prompts";
import { buildAceTools } from "@/lib/ai/ace-tools";
import { z } from "zod";
import { getViolationSummary } from "@/lib/data/violations";
import { sql, isDbConfigured } from "@/lib/db";
import { addMessage, getMessages, upsertConversation } from "@/lib/chat";
import {
  buildAssistantFallback,
  computeSummary,
  extractSummaryRows,
  type ToolLogEntry,
} from "@/lib/ai/assistant-utils";
import { getExa } from "@/lib/ai/exa";
import { elevenlabs } from "@ai-sdk/elevenlabs";
// no next/headers in route handlers; use req.headers
import { getNeonMCPTools } from "@/lib/mcp/neon";
import { stackServerApp } from "@/stack/server";
import { emailTools } from "@/lib/ai/email-tools";

export const runtime = "nodejs";
const TOOL_META_SENTINEL = "[[AI_TOOL_META]]";

function stripSqlComments(sqlText: string) {
  return sqlText.replace(/--.*?$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function ensureReadOnlySql(sqlText: string):
  | { ok: true; statement: string }
  | { ok: false; reason: string } {
  const withoutComments = stripSqlComments(sqlText);
  const trimmed = withoutComments.trim();
  if (!trimmed) {
    return { ok: false, reason: "SQL statement required." };
  }

  const single = trimmed.replace(/[;\s]+$/, "").trim();
  const lowered = single.toLowerCase();

  if (!lowered.startsWith("select") && !lowered.startsWith("with ")) {
    return { ok: false, reason: "Only SELECT queries are permitted." };
  }

  const forbiddenKeywords = [
    "insert",
    "update",
    "delete",
    "drop",
    "truncate",
    "alter",
    "grant",
    "revoke",
    "comment",
    "create",
    "attach",
    "replace",
    "vacuum",
    "merge",
    "call",
    "execute",
  ];

  if (forbiddenKeywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(lowered))) {
    return { ok: false, reason: "Statement not allowed." };
  }

  if (single.includes(";")) {
    return { ok: false, reason: "Only a single statement is permitted." };
  }

  return { ok: true, statement: single };
}

function toSerializable(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value && typeof value === "object" ? Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 50)) : String(value);
  }
}

export async function POST(req: Request) {
  const currentUser = await stackServerApp.getUser({ tokenStore: req, or: "return-null" });
  try {
    const body = await req.json().catch(() => ({}));
    const { routeId, start, end, question, model, conversationId: conversationIdInput, title } = body || {};

    const headerModel = req.headers.get("x-model") || undefined;

    // Ensure conversation exists and persist the user message
    const conversation = await upsertConversation(conversationIdInput ?? null, title ?? null);
    const conversationId = conversation.id;
    if (question) {
      await addMessage({ conversationId, role: "user", content: String(question) });
    }

    // Require AI Gateway key to be provided by environment (no hardcoded fallback)

    // Offline mode: explicit model "offline" or missing AI gateway key
    if (model === "offline" || !process.env.AI_GATEWAY_API_KEY) {
      try {
        const forwardedProto = req.headers.get("x-forwarded-proto") || "http";
        const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
        const origin = process.env.NEXT_PUBLIC_BASE_URL || `${forwardedProto}://${forwardedHost}`;
        const url = new URL("/api/violations/summary", origin);
        if (routeId) url.searchParams.set("routeId", routeId);
        if (start) url.searchParams.set("start", start);
        if (end) url.searchParams.set("end", end);
        let data: any = { rows: [] };
        try {
          const dataRes = await fetch(url.toString(), { cache: "no-store" });
          if (dataRes.ok) {
            data = await dataRes.json();
          }
        } catch {}
        const rows = (data?.rows || []) as Array<{ violations?: string; exempt_count?: string; bus_route_id?: string; date_trunc_ym?: string }>;
        const totalViolations = rows.reduce((a, r) => a + Number(r.violations || 0), 0);
        const totalExempt = rows.reduce((a, r) => a + Number(r.exempt_count || 0), 0);
        const routes = Array.from(new Set(rows.map((r) => r.bus_route_id).filter(Boolean)));
        const months = Array.from(new Set(rows.map((r) => r.date_trunc_ym).filter(Boolean))).sort();
        const share = totalViolations ? Math.round((totalExempt / totalViolations) * 1000) / 10 : 0;
        const text = [
          `- Violations observed: ${totalViolations.toLocaleString()} across ${routes.length} routes`,
          `- Exempt share: ${share}% (${totalExempt.toLocaleString()} exempt)`,
          months.length ? `- Coverage window: ${months[0]} → ${months[months.length - 1]}` : `- Coverage window: not available`,
        ].join("\n");
        return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "x-conversation-id": conversationId } });
      } catch (e) {
        return new Response("AI is unavailable. Please configure AI_GATEWAY_API_KEY.", { headers: { "Content-Type": "text/plain; charset=utf-8", "x-conversation-id": conversationId } });
      }
    }

    // Ensure Vercel AI Gateway key is provided by environment; do not fall back to hardcoded defaults

    const historyMessages = await getMessages(conversationId, 200);
    const modelMessages = historyMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    if (modelMessages.length === 0) {
      const fallbackPrompt = question
        ? String(question)
        : `Generate a concise summary of ACE violations${
            routeId ? ` for route ${routeId}` : ""
          }${
            start || end ? ` between ${start ?? "the beginning"} and ${end ?? "now"}` : ""
          }.`;
      modelMessages.push({ role: "user", content: fallbackPrompt });
    }

    // Build local tools (Exa + direct Neon DB access)

    const toolCallMap = new Map<string, { name: string; input?: unknown }>();
    const toolLogs: ToolLogEntry[] = [];

    const localTools: Record<string, any> = {
      ...emailTools,
      webSearch: {
        description: "Search the web for up-to-date information",
        inputSchema: z.object({
          query: z.string().min(1).max(50).describe("The search query"),
        }),
        execute: async ({ query }: { query: string }) => {
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
      },
      getViolationsSummary: {
        description: "Fetch grouped violations and exempt counts per route per month",
        inputSchema: z.object({
          routeId: z.string().optional(),
          start: z.string().optional(),
          end: z.string().optional(),
          limit: z.number().optional().default(5000),
        }),
        execute: async ({ routeId, start, end, limit }: { routeId?: string; start?: string; end?: string; limit?: number }) => {
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
      visualize: {
        description:
          "Render a simple chart UI from provided data. Supports 'line', 'grouped-bar', 'bar', and 'pie'. Typically call an MCP SQL tool first, then pass rows here.",
        inputSchema: z.object({
          spec: z.object({
            type: z.enum(["line", "grouped-bar", "bar", "pie", "multi-line"]),
            title: z.string().optional(),
            yLabel: z.string().optional(),
            // multi-line specific (optional):
            series: z.array(z.string()).optional(),
            xKey: z.string().optional(),
            yKey: z.string().optional(),
            aceRoute: z.string().optional(),
            markerLabel: z.string().optional(),
            marker: z
              .object({ x: z.string(), label: z.string().optional() })
              .optional(),
          }),
          data: z.union([
            z.array(z.record(z.any())),
            z.object({ rows: z.array(z.record(z.any())) }),
          ]),
        }),
        execute: async ({ spec, data }: { spec: any; data: any }) => {
          const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : (data as any);
          if (spec.type === "multi-line") {
            const xKey: string = spec.xKey || "week_start";
            const yKey: string = spec.yKey || "avg_mph";
            const routeKey = "route_id";
            const aceKey = "ace_go_live";

            const inputRows: any[] = Array.isArray(rows) ? rows : [];
            // Collect routes
            const routeSet = new Set<string>(
              Array.isArray(spec.series) && spec.series.length
                ? spec.series
                : inputRows
                    .map((r) => String(r?.[routeKey] ?? ""))
                    .filter((v) => Boolean(v))
            );
            const series = Array.from(routeSet);

            // Build (week_start -> point)
            const byX = new Map<string, Record<string, number | string>>();
            let aceDate: string | null = null;
            const aceRoute = spec.aceRoute || (series.length ? series[0] : null);

            for (const r of inputRows) {
              const xRaw = r?.[xKey];
              if (!xRaw) continue;
              // Normalize label to YYYY-MM-DD
              const label = typeof xRaw === "string" ? xRaw.slice(0, 10) : new Date(xRaw).toISOString().slice(0, 10);
              const route = String(r?.[routeKey] ?? "");
              if (!route) continue;
              const valueNum = Number(r?.[yKey] ?? 0);
              const point = byX.get(label) ?? { label };
              point[route] = Number.isFinite(valueNum) ? valueNum : 0;
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

            const marker = spec.marker || (aceDate
              ? { x: aceDate, label: spec.markerLabel || (aceRoute ? `ACE go-live: ${aceRoute} (${aceDate})` : `ACE go-live (${aceDate})`) }
              : undefined);

            return {
              chart: { type: "multi-line", series, yLabel: spec.yLabel || "Average speed (mph)", marker },
              data: points,
            };
          }
          if (spec.type === "line") {
            const xKey: string | undefined = spec.xKey;
            const yKey: string | undefined = spec.yKey;
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
                  name: String((spec.xKey ? d?.[spec.xKey] : (d.name ?? d.label ?? d.date_trunc_ym)) ?? ""),
                  violations: Number(d.violations ?? d.value ?? 0),
                  exempt: Number(d.exempt ?? d.exempt_count ?? 0),
                }))
              : [];
            return { chart: spec, data: out };
          }
          if (spec.type === "bar") {
            const xKey: string | undefined = spec.xKey;
            const yKey: string | undefined = spec.yKey;
            const out = Array.isArray(rows)
              ? rows.map((d: any) => ({
                  label: String((xKey ? d?.[xKey] : (d.label ?? d.name)) ?? ""),
                  value: Number((yKey ? d?.[yKey] : (d.value ?? d.count ?? d.avg_mph)) ?? 0),
                }))
              : [];
            return { chart: spec, data: out };
          }
          if (spec.type === "pie") {
            const xKey: string | undefined = spec.xKey;
            const yKey: string | undefined = spec.yKey;
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
    },
      createMap: {
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
        execute: async ({ spec, data, config }: { spec: any; data: any; config: any }) => {
          const rows: any[] = Array.isArray((data as any)?.rows) ? (data as any).rows : (Array.isArray(data) ? data : []);

          if (!Array.isArray(rows) || rows.length === 0) {
            return { error: "No data provided for map" };
          }

          function colorFromValue(value: unknown): string {
            if (typeof value === "number" && Number.isFinite(value)) {
              if (value < 10) return "#10b981"; // green
              if (value < 50) return "#f59e0b"; // amber
              return "#ef4444"; // red
            }
            if (value == null) return "#2563eb"; // default blue
            const s = String(value);
            let hash = 0;
            for (let i = 0; i < s.length; i++) hash = (hash << 5) - hash + s.charCodeAt(i);
            const palette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
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
              const color = config.colorKey ? colorFromValue(row?.[config.colorKey]) : "#2563eb";
              return { id: `m-${index}`, latitude: lat, longitude: lng, title, description, href, color };
            })
            .filter(Boolean) as Array<{
              id: string; latitude: number; longitude: number; title?: string; description?: string; href?: string; color?: string;
            }>;

          if (!markers.length) {
            return { error: "No valid coordinates found in data" };
          }

          let center: [number, number] | undefined = spec.center as any;
          if (!center) {
            const avgLat = markers.reduce((s, m) => s + m.latitude, 0) / markers.length;
            const avgLng = markers.reduce((s, m) => s + m.longitude, 0) / markers.length;
            center = [avgLng, avgLat];
          }

          return {
            chart: {
              type: "map",
              title: spec.title,
              center,
              zoom: spec.zoom ?? 10,
              cluster: spec.cluster ?? true,
            },
            data: markers,
          };
        },
      },
      transcribeAudio: {
        description: "Transcribe audio files to text using ElevenLabs speech-to-text",
        inputSchema: z.object({
          audio: z.string().describe("Base64 encoded audio data or audio file URL"),
          languageCode: z.string().optional().describe("ISO-639-1 language code (e.g., 'en')"),
          tagAudioEvents: z.boolean().optional().default(true).describe("Whether to tag audio events like (laughter)"),
          numSpeakers: z.number().int().optional().describe("Maximum number of speakers (up to 32)"),
          timestampsGranularity: z.enum(["none", "word", "character"]).optional().default("word").describe("Granularity of timestamps"),
          diarize: z.boolean().optional().default(true).describe("Whether to identify speakers"),
        }),
        execute: async ({ audio, languageCode, tagAudioEvents, numSpeakers, timestampsGranularity, diarize }: { audio: string; languageCode?: string; tagAudioEvents?: boolean; numSpeakers?: number; timestampsGranularity?: "none" | "word" | "character"; diarize?: boolean }) => {
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
      },
  };

    // ===== Model tools (external Model API) =====
    const aceTools = await buildAceTools();
    Object.assign(localTools, aceTools);

    if (isDbConfigured) {
      Object.assign(localTools, {
        describeTable: {
          description: "Describe the schema of an allowed table (public schema only).",
          inputSchema: z.object({ table: z.string().describe("Table name (validated against allow-list)") }),
          execute: async ({ table }: { table: string }) => {
            try {
              const result = await import("@/lib/ai/sql-tools");
              return await result.queryTableSchema({ table });
            } catch (error: any) {
              return { error: error?.message || "Describe table failed" };
            }
          },
        },
        listTables: {
          description: "List table names in the 'public' schema",
          inputSchema: z.object({}),
          execute: async () => {
            const rows = await sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`;
            return { tables: (rows as any[]).map((r: any) => r.table_name) };
          },
        },
      });
    }

    // Attach Neon MCP tools if available (best-effort)
    const mcp = await getNeonMCPTools().catch(() => null);
    const tools: Record<string, any> = { ...(localTools as Record<string, any>), ...(mcp?.tools || {}) };

    // Provide snake_case aliases for common local tools to handle provider/model naming variations
    const alias = (from: string, to: string) => {
      if (!(from in tools) && to in tools) {
        tools[from] = tools[to];
        // mark origin for introspection consistency
        if (tools[to]?.__origin && !tools[from].__origin) tools[from].__origin = tools[to].__origin;
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

    // Prefer Neon MCP run_sql aliases when available
    if (mcp?.tools?.run_sql) tools.runSql = mcp.tools.run_sql;
    if (mcp?.tools?.run_sql_transaction) tools.runSqlTransaction = mcp.tools.run_sql_transaction;

    // Discovery helper: enumerate available tools (local + MCP)
    tools.list_resources = {
      description: "List available tool operations (local and Neon MCP)",
      // Root schema must be an object for providers like Vercel AI Gateway/Bedrock
      inputSchema: z.object({
        only_tools: z.boolean().optional(),
        onlyTools: z.boolean().optional(),
      }),
      execute: async (args?: { only_tools?: boolean; onlyTools?: boolean }) => {
        const names = Object.keys(tools);
        const originMap: Record<string, string> = {};
        for (const name of names) {
          const origin = (tools as any)[name]?.__origin || "local";
          originMap[name] = String(origin);
        }
        const only = args?.only_tools ?? args?.onlyTools ?? true;
        if (only) return names;
        return { tools: names.map((n) => ({ name: n, origin: originMap[n] })) };
      },
    };

    const result = streamText({
      model: headerModel ?? (model || "openai/gpt-5-mini"),
      // Centralized system prompt: edit in lib/ai/system-prompts.ts
      system: SYSTEM_PROMPTS.streaming,
      messages: modelMessages,
      tools,
      toolChoice: "auto",
      stopWhen: stepCountIs(20),
      onStepFinish({ toolCalls, toolResults }) {
        toolCalls?.forEach((call) => {
          toolCallMap.set(call.toolCallId, {
            name: call.toolName,
            input: toSerializable(call.input),
          });
        });
        toolResults?.forEach((result) => {
          const matchingCall = result.toolCallId ? toolCallMap.get(result.toolCallId) : undefined;
          const serialOutput = toSerializable(result.output);
          const errorText =
            serialOutput && typeof serialOutput === "object" && serialOutput !== null && "error" in serialOutput
              ? String((serialOutput as Record<string, unknown>).error)
              : undefined;
          toolLogs.push({
            id: result.toolCallId ?? `${result.toolName}-${toolLogs.length}`,
            name: matchingCall?.name ?? result.toolName,
            input: matchingCall?.input,
            output: serialOutput,
            error: errorText,
          });
        });
      },
    });

    let assistantBuffer = "";
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const text of result.textStream) {
            assistantBuffer += text;
            controller.enqueue(encoder.encode(text));
          }
        } catch (e) {
          controller.enqueue(encoder.encode("\n[stream error]\n"));
        } finally {
          if (!assistantBuffer.trim()) {
            try {
              const summaryRows = extractSummaryRows(toolLogs);
              const summary = summaryRows ? computeSummary(summaryRows) : null;
              const fallbackText =
                buildAssistantFallback(summary, toolLogs, typeof question === "string" ? question : "") ??
                "I wasn't able to generate an answer this time.";
              controller.enqueue(encoder.encode(fallbackText));
              assistantBuffer = fallbackText;
            } catch {}
          }

          try {
            const metaPayload = JSON.stringify({ toolLogs });
            controller.enqueue(encoder.encode(`\n${TOOL_META_SENTINEL}${metaPayload}`));
          } catch {}

          // Persist assistant message at the end of the stream (with tool metadata)
          if (assistantBuffer.trim()) {
            try {
              await addMessage({ conversationId, role: "assistant", content: assistantBuffer, meta: { toolLogs } });
            } catch {}
          }
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "x-conversation-id": conversationId } });
  } catch (e) {
    return new Response("AI is temporarily unavailable.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
