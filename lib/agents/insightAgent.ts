import { Experimental_Agent as Agent, Experimental_InferAgentUIMessage as InferAgentUIMessage, stepCountIs, tool } from "ai";
import { z } from "zod";
import {
  getExemptRepeaters,
  getHotspots,
  getRouteTotals,
  getViolationSummary,
  getViolationTotals,
} from "@/lib/data/violations";
import { ROUTE_COMPARISONS, STUDENT_COMMUTE_PROFILES } from "@/lib/data/insights";

const numberFormatter = new Intl.NumberFormat("en-US");

// Ensure Vercel AI Gateway key is available for the default Gateway provider
if (typeof process !== "undefined") {
  process.env.AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || "vck_71Q1WAPSF8Hxrgs9wXw0k8sdl8oHndAnZch694sGbRkTa7aHuT46f1oo";
}

function formatShare(violations: number, exempt: number) {
  if (!violations) return "0%";
  const pct = (exempt / violations) * 100;
  return `${pct.toFixed(1)}%`;
}

export const insightAgent = new Agent({
  model: "openai/gpt-5",
  stopWhen: stepCountIs(10),
  system: `You are the ACE Insight Copilot built for the MTA Datathon. Blend Neon Postgres analytics with curated ACE narratives.
- Always cite specific metrics, date ranges, and route IDs when responding.
- Prefer tabular or bulleted formats for data-heavy answers.
- Highlight comparisons across ACE vs non-ACE routes whenever relevant.
- Offer SQL recipes or follow-up analysis steps when the user needs to replicate work.
- Tie recommendations back to riders, enforcement teams, and policy impact.
` ,
  tools: {
    route_overview: tool({
      description: "Summarize aggregated ACE violations for a given route and optional date window.",
      inputSchema: z.object({
        routeId: z.string().describe("Bus route ID, e.g. M15-SBS"),
        start: z.string().optional().describe("ISO start timestamp"),
        end: z.string().optional().describe("ISO end timestamp"),
      }),
      execute: async ({ routeId, start, end }) => {
        const [totals, summary] = await Promise.all([
          getViolationTotals({ routeId, start, end }),
          getViolationSummary({ routeId, start, end, limit: 120 }),
        ]);

        const monthlyLines = summary
          .slice()
          .sort((a, b) => a.month.localeCompare(b.month))
          .map(
            (row) =>
              `${row.month}: ${numberFormatter.format(row.violations)} violations (${formatShare(
                row.violations,
                row.exemptCount
              )} exempt)`
          )
          .join("\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `Route ${routeId} overview:\nTotal violations: ${numberFormatter.format(
                totals.totalViolations
              )}\nExempt share: ${formatShare(totals.totalViolations, totals.totalExempt)}\nRoutes observed: ${totals.routes.size}\nWindow: ${
                totals.months[0] ?? "n/a"
              } → ${totals.months[totals.months.length - 1] ?? "n/a"}\n\nMonthly trend:\n${monthlyLines || "No data available"}`,
            },
          ],
        };
      },
    }),
    top_routes: tool({
      description: "List routes sorted by total violations or exempt share.",
      inputSchema: z.object({
        orderBy: z.enum(["violations", "exempt_share"]).default("violations"),
        limit: z.number().int().min(1).max(50).default(10),
      }),
      execute: async ({ limit, orderBy }) => {
        const rows = await getRouteTotals({ limit, orderBy });
        const formatted = rows
          .map((row, index) => {
            const exemptShare = formatShare(row.violations, row.exemptCount);
            return `${index + 1}. ${row.busRouteId}: ${numberFormatter.format(row.violations)} violations (${exemptShare} exempt)`;
          })
          .join("\n");
        return {
          content: [
            {
              type: "text" as const,
              text: formatted || "No route data available.",
            },
          ],
        };
      },
    }),
    hotspots: tool({
      description: "Retrieve top hotspot coordinates and counts for ACE violations.",
      inputSchema: z.object({
        routeId: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ routeId, limit }) => {
        const rows = await getHotspots({ routeId, limit });
        const formatted = rows
          .map((row, index) => {
            const share = formatShare(row.violations, row.exemptCount);
            return `${index + 1}. ${row.busRouteId} · ${row.stopName ?? "Unknown stop"} (${row.latitude.toFixed(
              5
            )}, ${row.longitude.toFixed(5)}): ${numberFormatter.format(row.violations)} violations (${share} exempt)`;
          })
          .join("\n");
        return {
          content: [
            { type: "text" as const, text: formatted || "No hotspots available." },
          ],
        };
      },
    }),
    exempt_repeaters: tool({
      description: "List vehicles with repeated exempt violations.",
      inputSchema: z.object({
        routeId: z.string().optional(),
        minOccurrences: z.number().int().min(1).max(50).default(5),
        limit: z.number().int().min(1).max(50).default(10),
      }),
      execute: async ({ routeId, minOccurrences, limit }) => {
        const rows = await getExemptRepeaters({ routeId, minOccurrences, limit });
        const formatted = rows
          .map((row, index) => `${index + 1}. ${row.vehicleId}: ${row.violations} exempt events across ${row.routes.join(", ")}`)
          .join("\n");
        return {
          content: [
            { type: "text" as const, text: formatted || "No repeaters detected." },
          ],
        };
      },
    }),
    curated_context: tool({
      description: "Look up curated ACE narratives and student commute profiles for richer storytelling.",
      inputSchema: z.object({
        routeId: z.string().optional(),
        campus: z.string().optional(),
      }),
      execute: async ({ routeId, campus }) => {
        const routeMatch = routeId ? ROUTE_COMPARISONS.find((r) => r.routeId.toLowerCase() === routeId.toLowerCase()) : undefined;
        const campusMatch = campus
          ? STUDENT_COMMUTE_PROFILES.find((profile) => profile.campus.toLowerCase() === campus.toLowerCase())
          : undefined;
        const snippets = [] as string[];
        if (routeMatch) {
          snippets.push(`Route ${routeMatch.routeId} narrative: ${routeMatch.narrative}`);
        }
        if (campusMatch) {
          snippets.push(
            `Campus ${campusMatch.campus} commute highlights: primary route ${campusMatch.primaryRoute.id} (${campusMatch.primaryRoute.reliabilityScore}), travel delta ${campusMatch.travelTimeDelta}. Recommendation: ${campusMatch.recommendation}`
          );
        }
        if (!snippets.length) {
          snippets.push("No curated context found for the given filters.");
        }
        return {
          content: [
            { type: "text" as const, text: snippets.join("\n") },
          ],
        };
      },
    }),
    sql_recipe: tool({
      description: "Return a Neon-ready SQL snippet for common ACE analysis tasks.",
      inputSchema: z.object({
        topic: z
          .enum(["route_performance", "campus_exposure", "hotspots", "exempt_repeaters", "cbd_trend"])
          .default("route_performance"),
      }),
      execute: async ({ topic }) => {
        const snippets: Record<string, string> = {
          route_performance: `-- Route performance over time\nSELECT\n  bus_route_id,\n  date_trunc('month', last_occurrence) AS month,\n  COUNT(*) AS violations,\n  SUM(CASE WHEN violation_status = 'EXEMPT' THEN 1 ELSE 0 END) AS exempt_count\nFROM violations\nWHERE bus_route_id = 'M15-SBS'\n  AND last_occurrence >= date_trunc('month', now()) - interval '12 months'\nGROUP BY 1, 2\nORDER BY 2;`,
          campus_exposure: `-- Campus exposure (violations within 0.1° bounding box)\nWITH campus AS (\n  SELECT 40.7738 AS lat, -73.9802 AS lng -- replace with campus coordinates\n), filtered AS (\n  SELECT *\n  FROM violations, campus\n  WHERE violation_latitude BETWEEN campus.lat - 0.1 AND campus.lat + 0.1\n    AND violation_longitude BETWEEN campus.lng - 0.1 AND campus.lng + 0.1\n)\nSELECT\n  bus_route_id,\n  COUNT(*) AS violations,\n  SUM(CASE WHEN violation_status = 'EXEMPT' THEN 1 ELSE 0 END) AS exempt_count\nFROM filtered\nGROUP BY 1\nORDER BY violations DESC;`,
          hotspots: `-- Top hotspots\nSELECT\n  bus_route_id,\n  stop_name,\n  round(violation_latitude::numeric, 6) AS lat,\n  round(violation_longitude::numeric, 6) AS lng,\n  COUNT(*) AS violations\nFROM violations\nWHERE last_occurrence >= date_trunc('month', now()) - interval '3 months'\nGROUP BY 1,2,3,4\nHAVING COUNT(*) > 25\nORDER BY violations DESC\nLIMIT 25;`,
          exempt_repeaters: `-- Repeat exempt vehicles\nSELECT\n  vehicle_id,\n  COUNT(*) AS exemptions,\n  ARRAY_AGG(DISTINCT bus_route_id) AS routes\nFROM violations\nWHERE violation_status = 'EXEMPT'\nGROUP BY vehicle_id\nHAVING COUNT(*) >= 5\nORDER BY exemptions DESC;`,
          cbd_trend: `-- CBD congestion pricing impact\nSELECT\n  bus_route_id,\n  CASE WHEN last_occurrence < DATE '2024-06-30' THEN 'pre' ELSE 'post' END AS period,\n  COUNT(*) AS violations,\n  AVG(speed_mph) AS avg_speed -- requires joined AVL speeds table\nFROM violations v\nLEFT JOIN bus_time_speeds s USING (violation_id)\nWHERE bus_route_id IN ('M15-SBS','M103','BxM1')\nGROUP BY 1,2\nORDER BY 1,2;`,
        };
        const sql = snippets[topic] || snippets.route_performance;
        return {
          content: [
            {
              type: "text" as const,
              text: `Here is a Neon SQL recipe for ${topic.replace(/_/g, " ")} analysis:\n\n${sql}`,
            },
          ],
        };
      },
    }),
    forecast_violations: tool({
      description: "Generate a short-term monthly forecast for a route using recent Neon history.",
      inputSchema: z.object({
        routeId: z.string().describe("Bus route ID, e.g. M15-SBS"),
        horizon: z.number().int().min(1).max(12).default(3),
      }),
      execute: async ({ routeId, horizon }) => {
        const history = await getViolationSummary({ routeId, limit: 36 });
        const sorted = history.slice().sort((a, b) => a.month.localeCompare(b.month));
        if (sorted.length < 3) {
          return {
            content: [{ type: "text" as const, text: `Not enough history to forecast ${routeId}. Need at least 3 months.` }],
          };
        }

        const recent = sorted.slice(-6);
        const avgViolations = recent.reduce((acc, row) => acc + row.violations, 0) / recent.length;
        const avgExemptShare = recent.reduce((acc, row) => acc + (row.violations ? row.exemptCount / row.violations : 0), 0) /
          recent.length;

        const lastDate = new Date(sorted[sorted.length - 1].month);
        const projections: string[] = [];
        for (let i = 1; i <= horizon; i++) {
          const future = new Date(lastDate);
          future.setMonth(future.getMonth() + i);
          const label = future.toLocaleDateString(undefined, { month: "short", year: "numeric" });
          const projectedViolations = Math.round(avgViolations);
          const projectedExempt = Math.round(projectedViolations * avgExemptShare);
          projections.push(
            `${label}: ~${numberFormatter.format(projectedViolations)} violations, ${formatShare(projectedViolations, projectedExempt)}`
          );
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Forecast for ${routeId} (based on last ${recent.length} months):\nAverage recent violations: ${numberFormatter.format(
                Math.round(avgViolations)
              )}\nAverage exempt share: ${(avgExemptShare * 100).toFixed(1)}%\n\nProjected horizon:\n${projections.join("\n")}`,
            },
          ],
        };
      },
    }),
  },
});

export type InsightAgentUIMessage = InferAgentUIMessage<typeof insightAgent>;
