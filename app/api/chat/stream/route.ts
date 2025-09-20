import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { createSocrataFromEnv } from "@/lib/data/socrata";
// no next/headers in route handlers; use req.headers

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { routeId, start, end, question } = body || {};

    // Fallback if no OpenAI key: return a simple non-streaming text summary
    if (!process.env.OPENAI_API_KEY) {
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
          `• Violations observed: ${totalViolations.toLocaleString()} across ${routes.length} routes`,
          `• Exempt share: ${share}% (${totalExempt.toLocaleString()} exempt)`,
          months.length ? `• Coverage window: ${months[0]} → ${months[months.length - 1]}` : `• Coverage window: not available`,
        ].join("\n");
        return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      } catch (e) {
        return new Response("AI is unavailable. Please configure OPENAI_API_KEY.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    }

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: "You are a transit analytics assistant. Be concise and quantitative.",
      prompt: question
        ? `Answer the question using tools when needed. Question: ${question}`
        : `Generate a concise summary of ACE violations for the selected window. Use tools.`,
      tools: {
        getViolationsSummary: {
          description: "Fetch grouped violations and exempt counts per route per month",
          inputSchema: z.object({
            routeId: z.string().optional(),
            start: z.string().optional(),
            end: z.string().optional(),
            limit: z.number().optional().default(5000),
          }),
          execute: async ({ routeId, start, end, limit }) => {
            const datasetId = process.env.NY_ACE_DATASET_ID || "";
            if (!datasetId) {
              return { rows: [] };
            }
            const soda = createSocrataFromEnv();
            const filters: string[] = [];
            if (routeId) filters.push(`bus_route_id = '${routeId}'`);
            if (start) filters.push(`last_occurrence >= '${start}'`);
            if (end) filters.push(`last_occurrence < '${end}'`);
            const where = filters.length ? filters.join(" AND ") : undefined;
            const rows = await soda.get(datasetId, {
              $select: [
                "bus_route_id",
                "date_trunc_ym := date_trunc_ym(last_occurrence)",
                "count(*) as violations",
                "count_if(violation_status = 'EXEMPT') as exempt_count",
              ].join(", "),
              $where: where,
              $group: "bus_route_id, date_trunc_ym",
              $order: "bus_route_id, date_trunc_ym",
              $limit: limit ?? 5000,
            });
            return { rows };
          },
        },
      },
      toolChoice: "auto",
      temperature: 0.2,
    });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const text of result.textStream) {
            controller.enqueue(encoder.encode(text));
          }
        } catch (e) {
          controller.enqueue(encoder.encode("\n[stream error]\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (e) {
    return new Response("AI is temporarily unavailable.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}


