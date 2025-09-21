import { streamText } from "ai";
import { z } from "zod";
import { getViolationSummary } from "@/lib/data/violations";
import { sql } from "@/lib/db";
import { addMessage, upsertConversation } from "@/lib/chat";
// no next/headers in route handlers; use req.headers

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { routeId, start, end, question, model, conversationId: conversationIdInput, title } = body || {};

    // Ensure conversation exists and persist the user message
    const conversation = await upsertConversation(conversationIdInput ?? null, title ?? null);
    const conversationId = conversation.id;
    if (question) {
      await addMessage({ conversationId, role: "user", content: String(question) });
    }

    // Fallback if no AI Gateway key: return a simple non-streaming text summary
    if (!process.env.AI_GATEWAY_API_KEY) {
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

    // Ensure Vercel AI Gateway key is available for the default Gateway provider
    process.env.AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || "vck_71Q1WAPSF8Hxrgs9wXw0k8sdl8oHndAnZch694sGbRkTa7aHuT46f1oo";

    const result = streamText({
      model: model || "openai/gpt-5",
      system: "You are a transit analytics assistant. Be concise and quantitative.",
      prompt: question
        ? `Answer the question using tools when needed. Question: ${question}`
        : `Generate a concise summary of ACE violations for the selected window. Use tools.`,
      tools: {
        runSql: {
          description: "Execute a SQL query against Neon Postgres (server-side only).",
          inputSchema: z.object({
            sql: z.string().describe("Full SQL string to execute"),
          }),
          execute: async ({ sql: raw }) => {
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
      },
      toolChoice: "auto",
      temperature: 0.2,
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
          // Persist assistant message at the end of the stream
          if (assistantBuffer.trim()) {
            try {
              await addMessage({ conversationId, role: "assistant", content: assistantBuffer });
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
