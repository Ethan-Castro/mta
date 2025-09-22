import { streamText, stepCountIs } from "ai";
import { SYSTEM_PROMPTS } from "@/lib/ai/system-prompts";
import { z } from "zod";
import { getViolationSummary } from "@/lib/data/violations";
import { sql } from "@/lib/db";
import { addMessage, getMessages, upsertConversation } from "@/lib/chat";
import {
  buildAssistantFallback,
  computeSummary,
  extractSummaryRows,
  type ToolLogEntry,
} from "@/lib/ai/assistant-utils";
import { getExa } from "@/lib/ai/exa";
// no next/headers in route handlers; use req.headers

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
    "analyze",
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

    // No MCP: tools are implemented locally (Exa + direct Neon DB access)

    const toolCallMap = new Map<string, { name: string; input?: unknown }>();
    const toolLogs: ToolLogEntry[] = [];

    const result = streamText({
      model: headerModel ?? (model || "openai/gpt-5-mini"),
      // Centralized system prompt: edit in lib/ai/system-prompts.ts
      system: SYSTEM_PROMPTS.streaming,
      messages: modelMessages,
      tools: {
        webSearch: {
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
        },
        runSql: {
          description: "Execute a SQL query against Neon Postgres (server-side only).",
          inputSchema: z.object({
            sql: z.string().describe("Full SQL string to execute"),
          }),
          execute: async ({ sql: raw }) => {
            const check = ensureReadOnlySql(raw);
            if ("reason" in check) {
              return { error: check.reason };
            }
            const rows = await sql.unsafe(check.statement);
            return { rows };
          },
        },
        describeTable: {
          description: "Describe the schema of an allowed table (public schema only).",
          inputSchema: z.object({ table: z.enum(["violations", "cuny_campus_locations", "bus_segment_speeds_2025", "bus_segment_speeds_2023_2024"]) }),
          execute: async ({ table }) => {
            try {
              const result = await import("@/lib/ai/sql-tools");
              return await result.queryTableSchema({ table });
            } catch (error: any) {
              return { error: error?.message || "Describe table failed" };
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
      },
      toolChoice: "auto",
      stopWhen: stepCountIs(15),
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
