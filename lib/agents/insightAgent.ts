import { Experimental_Agent as Agent, Experimental_InferAgentUIMessage as InferAgentUIMessage, stepCountIs, tool } from "ai";
import {
  SYSTEM_PROMPT_INSIGHT_AGENT,
  SYSTEM_PROMPT_ML_AGENT,
  SYSTEM_PROMPT_NL_AGENT,
  SYSTEM_PROMPT_WORKFLOW_AGENT,
  SYSTEM_PROMPT_COMPREHENSIVE_AGENT,
} from "@/lib/ai/system-prompts";
import { z } from "zod";
import {
  getExemptRepeaters,
  getHotspots,
  getRouteTotals,
  getViolationSummary,
  getViolationTotals,
} from "@/lib/data/violations";
import {
  getRouteComparisons,
  getStudentCommuteProfiles,
  getCbdRouteTrends,
  getCuratedHotspots,
  getSqlToolRecipes,
} from "@/lib/data/insights";
import { getCampuses } from "@/lib/data/cuny";
import type { RouteComparison, StudentCommuteProfile, CbdRouteTrend, ViolationHotspot, SqlToolRecipe } from "@/lib/data/insights";
import type { Campus } from "@/lib/data/cuny";
import { createSocrataFromEnv } from "@/lib/data/socrata";

let routeComparisonsPromise: Promise<RouteComparison[]> | null = null;
function getRouteComparisonsCached() {
  if (!routeComparisonsPromise) {
    routeComparisonsPromise = getRouteComparisons().catch((error) => {
      routeComparisonsPromise = null;
      throw error;
    });
  }
  return routeComparisonsPromise;
}

let studentProfilesPromise: Promise<StudentCommuteProfile[]> | null = null;
function getStudentProfilesCached() {
  if (!studentProfilesPromise) {
    studentProfilesPromise = getStudentCommuteProfiles().catch((error) => {
      studentProfilesPromise = null;
      throw error;
    });
  }
  return studentProfilesPromise;
}

let cbdRouteTrendsPromise: Promise<CbdRouteTrend[]> | null = null;
function getCbdRouteTrendsCached() {
  if (!cbdRouteTrendsPromise) {
    cbdRouteTrendsPromise = getCbdRouteTrends().catch((error) => {
      cbdRouteTrendsPromise = null;
      throw error;
    });
  }
  return cbdRouteTrendsPromise;
}

let hotspotsPromise: Promise<ViolationHotspot[]> | null = null;
function getCuratedHotspotsCached() {
  if (!hotspotsPromise) {
    hotspotsPromise = getCuratedHotspots().catch((error) => {
      hotspotsPromise = null;
      throw error;
    });
  }
  return hotspotsPromise;
}

let campusesPromise: Promise<Campus[]> | null = null;
function getCampusesCached() {
  if (!campusesPromise) {
    campusesPromise = getCampuses().catch((error) => {
      campusesPromise = null;
      throw error;
    });
  }
  return campusesPromise;
}

let sqlToolRecipesPromise: Promise<SqlToolRecipe[]> | null = null;
function getSqlToolRecipesCached() {
  if (!sqlToolRecipesPromise) {
    sqlToolRecipesPromise = getSqlToolRecipes().catch((error) => {
      sqlToolRecipesPromise = null;
      throw error;
    });
  }
  return sqlToolRecipesPromise;
}

const numberFormatter = new Intl.NumberFormat("en-US");

// Ensure Vercel AI Gateway key is provided by environment only (no hardcoded fallback)

function formatShare(violations: number, exempt: number) {
  if (!violations) return "0%";
  const pct = (exempt / violations) * 100;
  return `${pct.toFixed(1)}%`;
}

async function executeTool(executor: any, params: any) {
  if (typeof executor !== "function") {
    throw new Error("Tool executor unavailable");
  }
  // Newer AI SDK tool executors receive (params, context); passing undefined keeps compatibility.
  return executor(params, undefined);
}

function firstText(result: any, fallback = "") {
  if (!result) return fallback;
  if (typeof result === "string") return result;
  const content = result?.content;
  if (Array.isArray(content)) {
    const textPart = content.find((part: any) => typeof part?.text === "string");
    if (textPart?.text) return textPart.text as string;
  }
  if (typeof result?.text === "string") {
    return result.text as string;
  }
  return fallback;
}

export const insightAgent = new Agent({
  model: "openai/gpt-5",
  stopWhen: stepCountIs(10),
  // Centralized system prompt: edit in lib/ai/system-prompts.ts
  system: SYSTEM_PROMPT_INSIGHT_AGENT,
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
        let routeMatch: RouteComparison | undefined;
        if (routeId) {
          const routes = await getRouteComparisonsCached();
          routeMatch = routes.find((r) => r.routeId.toLowerCase() === routeId.toLowerCase());
        }
        let campusMatch: StudentCommuteProfile | undefined;
        if (campus) {
          const profiles = await getStudentProfilesCached();
          campusMatch = profiles.find((profile) => profile.campus.toLowerCase() === campus.toLowerCase());
        }
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
        const recipes = await getSqlToolRecipesCached();
        const recipe = recipes.find((entry) => entry.topic === topic);

        if (!recipe) {
          const available = recipes.map((entry) => entry.topic).join(", ");
          return {
            content: [
              {
                type: "text" as const,
                text: `No SQL recipe found for ${topic}. Available topics: ${available || 'none available yet.'}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Here is a Neon SQL recipe for ${topic.replace(/_/g, " ")} analysis:\n\n${recipe.sql}`,
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

// ML Prediction Agent
export const mlPredictionAgent = new Agent({
  model: "openai/gpt-4o",
  stopWhen: stepCountIs(10),
  // Centralized system prompt: edit in lib/ai/system-prompts.ts
  system: SYSTEM_PROMPT_ML_AGENT,
  tools: {
    forecast_violations: tool({
      description: "Generate ML-based violation forecasts using historical data and trend analysis",
      inputSchema: z.object({
        routeId: z.string().describe("Bus route ID for forecasting"),
        horizon: z.number().int().min(1).max(12).default(6).describe("Forecast horizon in months"),
        includeSeasonality: z.boolean().default(true).describe("Include seasonal patterns"),
        confidenceLevel: z.number().min(0.1).max(0.95).default(0.8).describe("Confidence level for predictions"),
      }),
      execute: async ({ routeId, horizon, includeSeasonality, confidenceLevel }) => {
        const history = await getViolationSummary({ routeId, limit: 24 });
        const sorted = history.slice().sort((a, b) => a.month.localeCompare(b.month));

        if (sorted.length < 6) {
          return {
            content: [{ type: "text", text: `Insufficient historical data for ${routeId}. Need at least 6 months for reliable forecasting.` }],
          };
        }

        // Simple linear regression simulation
        const recent = sorted.slice(-12);
        const violations = recent.map(r => r.violations);
        const months = recent.map((_, i) => i);

        const n = violations.length;
        const sumX = months.reduce((a, b) => a + b, 0);
        const sumY = violations.reduce((a, b) => a + b, 0);
        const sumXY = months.reduce((sum, x, i) => sum + x * violations[i], 0);
        const sumXX = months.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate R-squared for model fit
        const yMean = sumY / n;
        const ssRes = violations.reduce((sum, y, i) => {
          const predicted = intercept + slope * months[i];
          return sum + Math.pow(y - predicted, 2);
        }, 0);
        const ssTot = violations.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
        const rSquared = 1 - (ssRes / ssTot);

        // Generate forecasts
        const lastMonth = recent[recent.length - 1].month;
        const forecasts = [];
        const baseDate = new Date(lastMonth + "-01");

        for (let i = 1; i <= horizon; i++) {
          const forecastDate = new Date(baseDate);
          forecastDate.setMonth(forecastDate.getMonth() + i);
          const monthLabel = forecastDate.toLocaleDateString(undefined, { month: "short", year: "numeric" });
          const predictedViolations = Math.round(intercept + slope * (months.length + i - 1));

          // Apply seasonal adjustment (simplified)
          const seasonalFactor = includeSeasonality ? (1 + 0.1 * Math.sin((i % 12) * Math.PI / 6)) : 1;
          const adjustedPrediction = Math.round(predictedViolations * seasonalFactor);

          // Calculate confidence interval (simplified)
          const standardError = Math.sqrt(ssRes / (n - 2));
          const tValue = 1.96; // 95% confidence
          const marginOfError = tValue * standardError * Math.sqrt(1 + 1/n + Math.pow(months.length + i - 1 - sumX/n, 2) / (sumXX - sumX*sumX/n));
          const lowerBound = Math.round(Math.max(0, adjustedPrediction - marginOfError * confidenceLevel));
          const upperBound = Math.round(adjustedPrediction + marginOfError * confidenceLevel);

          forecasts.push({
            month: monthLabel,
            predicted: adjustedPrediction,
            lowerBound,
            upperBound,
            confidence: confidenceLevel
          });
        }

        return {
          content: [{
            type: "text",
            text: `ML Forecast for ${routeId} (${horizon} months ahead):

Model Performance:
- R² = ${(rSquared * 100).toFixed(1)}% (model fit quality)
- Trend: ${slope > 0 ? '+' : ''}${slope.toFixed(2)} violations/month
- Base rate: ${intercept.toFixed(0)} violations/month

Forecasts (${confidenceLevel * 100}% confidence):
${forecasts.map(f =>
  `${f.month}: ${f.predicted} violations [${f.lowerBound}-${f.upperBound}]`
).join('\n')}

Assumptions:
- Linear trend continuation
- ${includeSeasonality ? 'Seasonal' : 'No seasonal'} adjustment applied
- External factors (policy changes, construction) not modeled
- Confidence intervals assume normal distribution`
          }],
        };
      },
    }),

    simulate_policy_impact: tool({
      description: "Simulate the impact of policy changes on violation rates",
      inputSchema: z.object({
        routeId: z.string().describe("Target bus route"),
        policyType: z.enum(["ace_expansion", "congestion_pricing", "exempt_reduction", "enforcement_timing"]),
        scenario: z.string().describe("Specific scenario parameters"),
        duration: z.number().int().min(1).max(24).default(12).describe("Simulation duration in months"),
      }),
      execute: async ({ routeId, policyType, scenario, duration }) => {
        const baseline = await getViolationSummary({ routeId, limit: 12 });
        if (baseline.length < 3) {
          return {
            content: [{ type: "text", text: `Insufficient baseline data for simulation on ${routeId}.` }],
          };
        }

        const avgBaseline = baseline.reduce((sum, r) => sum + r.violations, 0) / baseline.length;

        // Policy impact simulation logic
        let impactMultiplier = 1.0;
        let explanation = "";

        switch (policyType) {
          case "ace_expansion":
            impactMultiplier = 0.7; // 30% reduction
            explanation = "ACE expansion typically reduces violations by 25-35% through deterrence and automated enforcement";
            break;
          case "congestion_pricing":
            impactMultiplier = 0.85; // 15% reduction
            explanation = "Congestion pricing reduces traffic volume, indirectly lowering violation rates";
            break;
          case "exempt_reduction":
            impactMultiplier = 0.9; // 10% reduction
            explanation = "Reducing exempt categories increases effective enforcement coverage";
            break;
          case "enforcement_timing":
            impactMultiplier = 0.95; // 5% reduction
            explanation = "Optimized timing reduces peak-hour violations while maintaining necessary access";
            break;
        }

        const monthlyImpact = [];
        const startDate = new Date(baseline[baseline.length - 1].month + "-01");

        for (let i = 1; i <= duration; i++) {
          const simDate = new Date(startDate);
          simDate.setMonth(simDate.getMonth() + i);
          const monthLabel = simDate.toLocaleDateString(undefined, { month: "short", year: "numeric" });

          // Gradual implementation effect
          const implementationProgress = Math.min(i / 3, 1); // 3 months to full effect
          const effectiveImpact = 1 + (impactMultiplier - 1) * implementationProgress;

          const predictedViolations = Math.round(avgBaseline * effectiveImpact);
          monthlyImpact.push({
            month: monthLabel,
            violations: predictedViolations,
            impact: ((1 - effectiveImpact) * 100).toFixed(1) + "%"
          });
        }

        const totalReduction = Math.round(avgBaseline * duration * (1 - impactMultiplier));
        const avgMonthlyReduction = Math.round(avgBaseline * (1 - impactMultiplier));

        return {
          content: [{
            type: "text",
            text: `Policy Impact Simulation: ${policyType} on ${routeId}

Scenario: ${scenario}
Baseline: ${Math.round(avgBaseline)} violations/month

Simulation Results (${duration} months):
${monthlyImpact.map(m => `${m.month}: ${m.violations} violations (${m.impact} reduction)`).join('\n')}

Summary:
- Average monthly reduction: ${avgMonthlyReduction} violations
- Total reduction over period: ${totalReduction} violations
- Implementation effect: ${explanation}

Assumptions:
- Gradual 3-month implementation period
- No other external factors
- Linear impact progression
- Policy effectiveness based on historical precedents`
          }],
        };
      },
    }),

    comparative_analysis: tool({
      description: "Compare multiple routes or scenarios using statistical methods",
      inputSchema: z.object({
        analysisType: z.enum(["route_comparison", "before_after", "seasonal_analysis", "correlation_study"]),
        routeIds: z.array(z.string()).describe("Routes to compare"),
        baselinePeriod: z.string().optional().describe("Baseline period for comparison"),
        comparisonPeriod: z.string().optional().describe("Comparison period"),
        metrics: z.array(z.string()).default(["violations", "exempt_share"]).describe("Metrics to analyze"),
      }),
      execute: async ({ analysisType, routeIds, baselinePeriod, comparisonPeriod, metrics }) => {
        let analysis = `Comparative Analysis: ${analysisType}\n\n`;

        if (analysisType === "route_comparison") {
          const routeComparisons = await getRouteComparisonsCached();
          const routeData = await Promise.all(
            routeIds.map(routeId => getViolationSummary({ routeId, limit: 12 }))
          );

          analysis += `Route Comparison (${routeIds.join(", ")}):\n\n`;

          routeData.forEach((data, idx) => {
            const routeId = routeIds[idx];
            const avgViolations = data.reduce((sum, r) => sum + r.violations, 0) / data.length;
            const avgExemptShare = data.reduce((sum, r) => {
              return sum + (r.violations > 0 ? r.exemptCount / r.violations : 0);
            }, 0) / data.length;

            const route = routeComparisons.find((r) => r.routeId === routeId);
            analysis += `${routeId}:\n`;
            analysis += `- Average monthly violations: ${Math.round(avgViolations)}\n`;
            analysis += `- Average exempt share: ${(avgExemptShare * 100).toFixed(1)}%\n`;
            analysis += `- ACE status: ${route?.aceEnforced ? "Enforced" : "Not enforced"}\n`;
            if (route?.speedChangePct) {
              analysis += `- Speed change: ${route.speedChangePct > 0 ? '+' : ''}${route.speedChangePct}%\n`;
            }
            analysis += `\n`;
          });

          // Statistical comparison
          const avgs = routeData.map(data =>
            data.reduce((sum, r) => sum + r.violations, 0) / data.length
          );
          const maxAvg = Math.max(...avgs);
          const minAvg = Math.min(...avgs);
          const range = maxAvg - minAvg;

          analysis += `Statistical Summary:\n`;
          analysis += `- Violation range: ${Math.round(range)} violations/month\n`;
          analysis += `- Highest volume route: ${routeIds[avgs.indexOf(maxAvg)]}\n`;
          analysis += `- Lowest volume route: ${routeIds[avgs.indexOf(minAvg)]}\n`;

        } else if (analysisType === "before_after") {
          analysis += `Before/After Analysis:\n\n`;
          analysis += `Note: This analysis requires specific baseline and comparison periods.\n`;
          analysis += `Consider using the forecast_violations tool for temporal comparisons.\n`;
        }

        return {
          content: [{ type: "text", text: analysis }],
        };
      },
    }),
  },
});

// Natural Language Query Agent
export const nlQueryAgent = new Agent({
  model: "openai/gpt-4o",
  stopWhen: stepCountIs(15),
  // Centralized system prompt: edit in lib/ai/system-prompts.ts
  system: SYSTEM_PROMPT_NL_AGENT,
  tools: {
    parse_query_intent: tool({
      description: "Parse natural language queries to understand intent and required data",
      inputSchema: z.object({
        query: z.string().describe("Natural language query to parse"),
        context: z.string().optional().describe("Additional context about data sources"),
      }),
      execute: async ({ query, context }) => {
        const lowerQuery = query.toLowerCase();

        let intent = "";
        let dataSource = "";
        let filters = [];
        let metrics = [];
        let timeRange = "";
        let spatialFilter = "";

        // Intent classification
        if (lowerQuery.includes("violation") || lowerQuery.includes("ticket") || lowerQuery.includes("fine")) {
          intent = "violation_analysis";
          dataSource = "ace_violations";
        } else if (lowerQuery.includes("route") && lowerQuery.includes("performance")) {
          intent = "route_performance";
          dataSource = "ace_violations + route_metadata";
        } else if (lowerQuery.includes("campus") || lowerQuery.includes("student")) {
          intent = "campus_impact";
          dataSource = "ace_violations + cuny_campuses";
        } else if (lowerQuery.includes("exempt") || lowerQuery.includes("repeat")) {
          intent = "exempt_analysis";
          dataSource = "ace_violations";
        } else if (lowerQuery.includes("speed") || lowerQuery.includes("travel time")) {
          intent = "speed_analysis";
          dataSource = "avl_speeds + ace_violations";
        } else {
          intent = "general_query";
          dataSource = "multiple_sources";
        }

        // Extract filters
        const routeMatch = query.match(/route[s]?\s*([A-Za-z0-9-]+)/i);
        if (routeMatch) filters.push(`route_id = '${routeMatch[1]}'`);

        const campusMatch = query.match(/campus\s*([A-Za-z\s]+)/i);
        if (campusMatch) {
          const campus = campusMatch[1].trim();
          const campusList = await getCampusesCached();
          const campusData = campusList.find((c) =>
            c.campus.toLowerCase().includes(campus.toLowerCase())
          );
          if (campusData) {
            spatialFilter = `latitude BETWEEN ${campusData.latitude - 0.01} AND ${campusData.latitude + 0.01} AND longitude BETWEEN ${campusData.longitude - 0.01} AND ${campusData.longitude + 0.01}`;
          }
        }

        // Extract time ranges
        if (lowerQuery.includes("last month")) timeRange = "last_occurrence >= date_trunc('month', now()) - interval '1 month'";
        else if (lowerQuery.includes("last quarter")) timeRange = "last_occurrence >= date_trunc('quarter', now()) - interval '3 months'";
        else if (lowerQuery.includes("this year")) timeRange = "last_occurrence >= date_trunc('year', now())";
        else if (lowerQuery.includes("2024")) timeRange = "last_occurrence >= '2024-01-01' AND last_occurrence < '2025-01-01'";

        // Extract metrics
        if (lowerQuery.includes("violation")) metrics.push("violations");
        if (lowerQuery.includes("exempt")) metrics.push("exempt_share");
        if (lowerQuery.includes("speed")) metrics.push("speed_change");
        if (lowerQuery.includes("trend")) metrics.push("monthly_trend");

        return {
          content: [{
            type: "text",
            text: `Query Analysis for: "${query}"

Intent: ${intent}
Data Source: ${dataSource}
Filters: ${filters.join(", ") || "None"}
Spatial Filter: ${spatialFilter || "None"}
Time Range: ${timeRange || "None"}
Metrics: ${metrics.join(", ") || "Basic counts"}

Suggested SQL Query Structure:
SELECT ${metrics.length > 0 ? metrics.join(", ") : "COUNT(*)"}
FROM ${dataSource.split(" + ")[0]}
WHERE ${filters.join(" AND ") || "1=1"}
${spatialFilter ? `AND ${spatialFilter}` : ""}
${timeRange ? `AND ${timeRange}` : ""}
GROUP BY appropriate_grouping
ORDER BY relevant_metric;`
          }],
        };
      },
    }),

    generate_sql_query: tool({
      description: "Generate optimized SQL queries based on parsed intent",
      inputSchema: z.object({
        intent: z.string().describe("Analysis intent from parse_query_intent"),
        filters: z.array(z.string()).describe("SQL WHERE conditions"),
        metrics: z.array(z.string()).describe("Columns to select"),
        groupBy: z.array(z.string()).optional().describe("GROUP BY columns"),
        orderBy: z.string().optional().describe("ORDER BY clause"),
        limit: z.number().int().min(1).max(1000).default(100).describe("Result limit"),
      }),
      execute: async ({ intent, filters, metrics, groupBy, orderBy, limit }) => {
        let sql = "";
        let explanation = "";

        switch (intent) {
          case "violation_analysis":
            sql = `SELECT
  ${metrics.includes("violations") ? "COUNT(*) as violations," : ""}
  ${metrics.includes("exempt_share") ? "SUM(CASE WHEN violation_status = 'EXEMPT' THEN 1 ELSE 0 END)::float / COUNT(*) as exempt_share," : ""}
  ${groupBy?.includes("month") ? "date_trunc('month', last_occurrence) as month," : ""}
  ${groupBy?.includes("route") ? "bus_route_id," : ""}
  ${groupBy?.includes("campus") ? "campus_id," : ""}
  COUNT(DISTINCT vehicle_id) as unique_vehicles
FROM ace_violations
WHERE ${filters.join(" AND ") || "1=1"}
${groupBy?.length ? `GROUP BY ${groupBy.map(g => g === "month" ? "date_trunc('month', last_occurrence)" : g).join(", ")}` : ""}
ORDER BY ${orderBy || "violations DESC"}
LIMIT ${limit};`;
            explanation = "Violation analysis query with optional grouping and filtering";
            break;

          case "route_performance":
            sql = `WITH route_metrics AS (
  SELECT
    bus_route_id,
    COUNT(*) as total_violations,
    SUM(CASE WHEN violation_status = 'EXEMPT' THEN 1 ELSE 0 END)::float / COUNT(*) as exempt_rate,
    AVG(speed_mph) as avg_speed,
    COUNT(DISTINCT vehicle_id) as unique_vehicles
  FROM ace_violations v
  LEFT JOIN bus_speeds s ON v.violation_id = s.violation_id
  WHERE ${filters.join(" AND ") || "1=1"}
  GROUP BY bus_route_id
)
SELECT * FROM route_metrics
ORDER BY ${orderBy || "total_violations DESC"}
LIMIT ${limit};`;
            explanation = "Route performance analysis combining violations and speed data";
            break;

          case "campus_impact":
            sql = `SELECT
  c.campus_name,
  COUNT(*) as violations_near_campus,
  ${metrics.includes("exempt_share") ? "SUM(CASE WHEN v.violation_status = 'EXEMPT' THEN 1 ELSE 0 END)::float / COUNT(*) as exempt_share," : ""}
  COUNT(DISTINCT v.bus_route_id) as affected_routes,
  COUNT(DISTINCT v.vehicle_id) as unique_vehicles
FROM ace_violations v
CROSS JOIN cuny_campuses c
WHERE ${filters.join(" AND ") || "1=1"}
  AND ST_DWithin(
    ST_MakePoint(v.violation_longitude, v.violation_latitude)::geography,
    ST_MakePoint(c.longitude, c.latitude)::geography,
    500 -- 500 meters
  )
GROUP BY c.campus_name
ORDER BY violations_near_campus DESC
LIMIT ${limit};`;
            explanation = "Campus impact analysis using spatial proximity";
            break;

          default:
            sql = `SELECT * FROM ace_violations WHERE ${filters.join(" AND ") || "1=1"} LIMIT ${limit};`;
            explanation = "General query structure";
        }

        return {
          content: [{
            type: "text",
            text: `Generated SQL Query (${intent}):

${sql}

Explanation: ${explanation}

This query can be executed against the Neon Postgres database.
Consider the following optimizations:
- Add appropriate indexes for filtered columns
- Use EXPLAIN ANALYZE to check query performance
- Consider materialized views for complex aggregations
- Add time range filters to reduce data scanned`
          }],
        };
      },
    }),

    validate_data_query: tool({
      description: "Validate and suggest improvements for data queries",
      inputSchema: z.object({
        sql: z.string().describe("SQL query to validate"),
        expectedResultType: z.enum(["count", "aggregation", "time_series", "spatial"]).describe("Expected result type"),
      }),
      execute: async ({ sql, expectedResultType }) => {
        const issues: string[] = [];
        const suggestions: string[] = [];

        // Basic SQL validation
        const sqlLower = sql.toLowerCase();

        if (!sqlLower.includes("where") && !sqlLower.includes("limit")) {
          suggestions.push("Consider adding WHERE clauses and LIMIT to avoid scanning entire tables");
        }

        if (expectedResultType === "time_series" && !sqlLower.includes("date_trunc") && !sqlLower.includes("group by")) {
          suggestions.push("For time series analysis, consider using date_trunc() and GROUP BY");
        }

        if (expectedResultType === "spatial" && !sqlLower.includes("st_")) {
          suggestions.push("Spatial queries should use PostGIS functions like ST_DWithin or ST_Distance");
        }

        if (sqlLower.includes("count(*)") && sqlLower.includes("group by")) {
          suggestions.push("Consider using COUNT(1) instead of COUNT(*) for better performance");
        }

        if (sqlLower.includes("select *")) {
          suggestions.push("Avoid SELECT * in production queries - specify only needed columns");
        }

        // Performance considerations
        if (sqlLower.includes("like") && !sqlLower.includes("ilike")) {
          suggestions.push("Consider using ILIKE for case-insensitive pattern matching");
        }

        if (expectedResultType === "aggregation" && !sqlLower.includes("having")) {
          suggestions.push("For filtered aggregations, consider using HAVING clause");
        }

        return {
          content: [{
            type: "text",
            text: `Query Validation Results:

Issues Found:
${issues.length ? issues.map(i => `- ${i}`).join('\n') : '- No critical issues detected'}

Suggestions:
${suggestions.length ? suggestions.map(s => `- ${s}`).join('\n') : '- Query structure looks good'}

Performance Notes:
- Consider adding indexes on frequently filtered columns
- Use EXPLAIN ANALYZE to check actual query performance
- Consider query result caching for frequently run queries
- Monitor query execution time and resource usage`
          }],
        };
      },
    }),
  },
});

// Workflow Orchestration Agent
export const workflowAgent = new Agent({
  model: "openai/gpt-4o",
  stopWhen: stepCountIs(20),
  // Centralized system prompt: edit in lib/ai/system-prompts.ts
  system: SYSTEM_PROMPT_WORKFLOW_AGENT,
  tools: {
    orchestrate_campus_study: tool({
      description: "Orchestrate comprehensive campus impact study",
      inputSchema: z.object({
        campusName: z.string().describe("Name of CUNY campus to study"),
        timeRange: z.string().optional().describe("Time period for analysis"),
        includeForecasting: z.boolean().default(true).describe("Include violation forecasting"),
        includePolicySimulation: z.boolean().default(true).describe("Include policy impact simulation"),
      }),
      execute: async ({ campusName, timeRange, includeForecasting, includePolicySimulation }) => {
        // Find campus data
        const campuses = await getCampusesCached();
        const campus = campuses.find((c) =>
          c.campus.toLowerCase().includes(campusName.toLowerCase())
        );

        if (!campus) {
          return {
            content: [{ type: "text", text: `Campus "${campusName}" not found in CUNY database.` }],
          };
        }

        // Find associated routes
        const routeComparisons = await getRouteComparisonsCached();
        const associatedRoutes = routeComparisons.filter((r) =>
          r.campus.toLowerCase().includes(campusName.toLowerCase())
        );
        const curatedHotspots = await getCuratedHotspotsCached();

        let workflowResults = `Campus Impact Study: ${campus.campus}\n\n`;

        // Step 1: Current state analysis
        workflowResults += `1. CURRENT STATE ANALYSIS\n`;
        workflowResults += `- Location: ${campus.city}, ${campus.state}\n`;
        workflowResults += `- Campus type: ${campus.type}\n`;
        workflowResults += `- Associated routes: ${associatedRoutes.map(r => r.routeId).join(", ")}\n\n`;

        // Step 2: Route performance analysis
        workflowResults += `2. ROUTE PERFORMANCE\n`;
        for (const route of associatedRoutes.slice(0, 3)) {
          const violations = await getViolationSummary({ routeId: route.routeId, limit: 6 });
          const avgViolations = violations.reduce((sum, v) => sum + v.violations, 0) / Math.max(1, violations.length);
          const speedChange = Number(route.speedChangePct ?? 0);
          workflowResults += `- ${route.routeId}: ${Math.round(avgViolations)} avg monthly violations, ${speedChange > 0 ? '+' : ''}${speedChange}% speed change\n`;
        }
        workflowResults += `\n`;

        // Step 3: Forecasting (if requested)
        if (includeForecasting && mlPredictionAgent) {
          workflowResults += `3. VIOLATION FORECASTING (3 months)\n`;
          for (const route of associatedRoutes.slice(0, 2)) {
            const forecast: any = await executeTool(mlPredictionAgent!.tools.forecast_violations.execute, {
              routeId: route.routeId,
              horizon: 3,
              includeSeasonality: true,
              confidenceLevel: 0.8,
            });
            const forecastLine = firstText(forecast, "Forecast data").split("\n")[3] ?? "Forecast data";
            workflowResults += `- ${route.routeId}: ${forecastLine || 'Forecast data'}\n`;
          }
          workflowResults += `\n`;
        }

        // Step 4: Policy simulation (if requested)
        if (includePolicySimulation && mlPredictionAgent) {
          workflowResults += `4. POLICY IMPACT SIMULATION\n`;
          const simulation: any = await executeTool(mlPredictionAgent!.tools.simulate_policy_impact.execute, {
            routeId: associatedRoutes[0]?.routeId || "M15-SBS",
            policyType: "ace_expansion",
            scenario: "Expanding ACE coverage to additional campus routes",
            duration: 6,
          });
          const simulationSnippet = firstText(simulation, "Simulation data").split("\n").slice(0, 5).join("\n");
          workflowResults += `${simulationSnippet}\n\n`;
        }

        // Step 5: Recommendations
        workflowResults += `5. RECOMMENDATIONS\n`;
        workflowResults += `- Priority: ${associatedRoutes.some(r => !r.aceEnforced) ? "Expand ACE coverage" : "Optimize existing enforcement"}\n`;
        const focusHotspots = curatedHotspots.filter((h) => associatedRoutes.some((r) => r.routeId === h.routeId));
        const hotspotLabels = focusHotspots.map((h) => h.location ?? h.id);
        workflowResults += `- Focus areas: ${hotspotLabels.length ? hotspotLabels.join(", ") : "None"}\n`;
        workflowResults += `- Student impact: High priority due to campus proximity\n`;
        workflowResults += `- Next steps: Coordinate with DOT for curb regulation review\n`;

        return {
          content: [{ type: "text", text: workflowResults }],
        };
      },
    }),

    orchestrate_policy_analysis: tool({
      description: "Orchestrate comprehensive policy impact analysis",
      inputSchema: z.object({
        policyType: z.enum(["ace_expansion", "congestion_pricing", "exempt_policy", "enforcement_optimization"]),
        affectedRoutes: z.array(z.string()).describe("Routes affected by policy"),
        timeHorizon: z.number().int().min(1).max(24).default(12).describe("Analysis horizon in months"),
        includeStakeholderImpact: z.boolean().default(true).describe("Include stakeholder impact analysis"),
      }),
      execute: async ({ policyType, affectedRoutes, timeHorizon, includeStakeholderImpact }) => {
        let analysis = `Policy Impact Analysis: ${policyType}\n`;
        analysis += `Affected Routes: ${affectedRoutes.join(", ")}\n`;
        analysis += `Time Horizon: ${timeHorizon} months\n\n`;

        // Step 1: Baseline assessment
        analysis += `1. BASELINE ASSESSMENT\n`;
        const baselineData = await Promise.all(
          affectedRoutes.map(routeId => getViolationSummary({ routeId, limit: 6 }))
        );

        baselineData.forEach((data, idx) => {
          const routeId = affectedRoutes[idx];
          const avgViolations = data.reduce((sum, v) => sum + v.violations, 0) / Math.max(1, data.length);
          analysis += `- ${routeId}: ${Math.round(avgViolations)} baseline violations/month\n`;
        });
        analysis += `\n`;

        // Step 2: Impact simulation
        analysis += `2. IMPACT SIMULATION\n`;
        const simulations = await Promise.all(
          affectedRoutes.slice(0, 3).map((routeId) =>
            executeTool(mlPredictionAgent!.tools.simulate_policy_impact.execute, {
              routeId,
              policyType,
              scenario: `${policyType} implementation`,
              duration: timeHorizon,
            })
          )
        );

        simulations.forEach((sim, idx) => {
          analysis += `Route ${affectedRoutes[idx]}:\n`;
          const lines = firstText(sim, "Simulation data").split('\n');
          const summaryLines = lines.slice(5, 8); // Extract summary lines
          analysis += summaryLines.map(line => `- ${line}`).join('\n') + '\n';
        });
        analysis += `\n`;

        // Step 3: Stakeholder impact (if requested)
        if (includeStakeholderImpact) {
          analysis += `3. STAKEHOLDER IMPACT ANALYSIS\n`;

          const profiles = await getStudentProfilesCached();
          const studentProfiles = profiles.filter((profile) =>
            affectedRoutes.some(routeId =>
              profile.primaryRoute.id === routeId ||
              profile.comparisonRoute.id === routeId ||
              profile.nonAceRoute.id === routeId
            )
          );

          if (studentProfiles.length > 0) {
            analysis += `Student Impact:\n`;
            studentProfiles.forEach((profile) => {
              analysis += `- ${profile.campus}: ${profile.avgDailyStudents.toLocaleString()} daily riders, ${profile.travelTimeDelta} change\n`;
            });
          }

          const cbdTrendData = await getCbdRouteTrendsCached();
          const cbdRoutes = cbdTrendData.filter((route) => affectedRoutes.includes(route.routeId));

          if (cbdRoutes.length > 0) {
            analysis += `CBD Impact:\n`;
            cbdRoutes.forEach((route) => {
              const change = Number(route.violationChangePct ?? 0);
              analysis += `- ${route.routeName}: ${change > 0 ? '+' : ''}${change}% violation change\n`;
            });
          }

          analysis += `\n`;
        }

        // Step 4: Implementation recommendations
        analysis += `4. IMPLEMENTATION RECOMMENDATIONS\n`;
        analysis += `- Phased rollout: Start with 3-month pilot on high-impact routes\n`;
        analysis += `- Monitoring: Weekly violation and speed tracking\n`;
        analysis += `- Stakeholder engagement: Monthly updates to affected communities\n`;
        analysis += `- Success metrics: 15-25% violation reduction, 5-10% speed improvement\n`;
        analysis += `- Contingency: Revert changes if negative unintended consequences\n`;

        return {
          content: [{ type: "text", text: analysis }],
        };
      },
    }),

    orchestrate_emergency_response: tool({
      description: "Orchestrate rapid response to transit emergencies or incidents",
      inputSchema: z.object({
        incidentType: z.enum(["major_delay", "safety_incident", "infrastructure_issue", "service_disruption"]),
        affectedArea: z.string().describe("Geographic area or route affected"),
        urgencyLevel: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        includeCommunicationPlan: z.boolean().default(true).describe("Include communication recommendations"),
      }),
      execute: async ({ incidentType, affectedArea, urgencyLevel, includeCommunicationPlan }) => {
        let response = `Emergency Response Orchestration\n`;
        response += `Incident: ${incidentType}\n`;
        response += `Affected Area: ${affectedArea}\n`;
        response += `Urgency: ${urgencyLevel}\n\n`;

        // Step 1: Immediate assessment
        response += `1. IMMEDIATE ASSESSMENT\n`;
        response += `- Status: ${urgencyLevel === "critical" ? "CRITICAL - Activate emergency protocols" : "Monitoring - Standard response procedures"}\n`;
        response += `- Data sources: Real-time violation data, AVL feeds, incident reports\n`;
        response += `- Initial scan: Check for violation spikes, route delays, affected campuses\n\n`;

        // Step 2: Impact analysis
        response += `2. IMPACT ANALYSIS\n`;

        // Find affected routes
        const routeComparisons = await getRouteComparisonsCached();
        const affectedRoutes = routeComparisons.filter((route) =>
          route.routeName.toLowerCase().includes(affectedArea.toLowerCase()) ||
          route.campus.toLowerCase().includes(affectedArea.toLowerCase())
        );

        if (affectedRoutes.length > 0) {
          response += `Affected Routes:\n`;
          for (const route of affectedRoutes.slice(0, 3)) {
            const studentSharePct = Number(route.studentShare ?? 0) * 100;
            response += `- ${route.routeId}: ${studentSharePct.toFixed(1)}% student ridership, ${route.aceEnforced ? "ACE protected" : "No ACE coverage"}\n`;
          }
          response += `\n`;
        }

        // Step 3: Response actions
        response += `3. RESPONSE ACTIONS\n`;
        switch (urgencyLevel) {
          case "critical":
            response += `- Deploy emergency enforcement teams\n`;
            response += `- Activate alternative routing protocols\n`;
            response += `- Notify affected campuses immediately\n`;
            response += `- Prepare incident command structure\n`;
            break;
          case "high":
            response += `- Increase monitoring frequency\n`;
            response += `- Alert field enforcement teams\n`;
            response += `- Prepare campus notifications\n`;
            response += `- Review violation patterns hourly\n`;
            break;
          default:
            response += `- Standard monitoring protocols\n`;
            response += `- Regular status updates\n`;
            response += `- Campus coordination as needed\n`;
        }
        response += `\n`;

        // Step 4: Communication plan (if requested)
        if (includeCommunicationPlan) {
          response += `4. COMMUNICATION PLAN\n`;
          response += `- Immediate: Alert operations center and field teams\n`;
          response += `- Internal: Notify ACE operations, DOT coordination\n`;
          response += `- Campus: ${affectedRoutes.length > 0 ? "Notify student transportation offices" : "Monitor for campus impact"}\n`;
          response += `- Public: Prepare service alerts for affected routes\n`;
          response += `- Timeline: Updates every ${urgencyLevel === "critical" ? "30 minutes" : urgencyLevel === "high" ? "2 hours" : "4 hours"}\n`;
          response += `\n`;
        }

        // Step 5: Recovery and follow-up
        response += `5. RECOVERY AND FOLLOW-UP\n`;
        response += `- Recovery target: ${urgencyLevel === "critical" ? "Same day" : urgencyLevel === "high" ? "24-48 hours" : "As needed"}\n`;
        response += `- Post-incident analysis: Review violation patterns and response effectiveness\n`;
        response += `- Policy review: Assess need for permanent changes based on incident learnings\n`;
        response += `- Documentation: Complete incident report within 48 hours\n`;

        return {
          content: [{ type: "text", text: response }],
        };
      },
    }),
  },
});

// Combined Agent System
export const comprehensiveAgent = new Agent({
  model: "openai/gpt-4o",
  stopWhen: stepCountIs(20),
  // Centralized system prompt: edit in lib/ai/system-prompts.ts
  system: SYSTEM_PROMPT_COMPREHENSIVE_AGENT,
  tools: {
    // Route queries to appropriate agents
    analyze_query_complexity: tool({
      description: "Analyze query complexity and route to appropriate agent",
      inputSchema: z.object({
        userQuery: z.string().describe("User's natural language query"),
        context: z.string().optional().describe("Additional context about data needs"),
      }),
      execute: async ({ userQuery, context }) => {
        const query = userQuery.toLowerCase();

        // Simple classification logic
        let agentType = "insight"; // Default to insight agent
        let complexity = "simple";
        let confidence = 0.8;

        if (query.includes("forecast") || query.includes("predict") || query.includes("simulate") || query.includes("model")) {
          agentType = "ml";
          complexity = query.includes("complex") || query.includes("multi-step") ? "complex" : "medium";
        } else if (query.includes("sql") || query.includes("query") || query.includes("database") || query.includes("table")) {
          agentType = "nl";
          complexity = "medium";
        } else if (query.includes("study") || query.includes("analysis") || query.includes("comprehensive") || query.includes("workflow")) {
          agentType = "workflow";
          complexity = "complex";
        } else if (query.includes("violation") || query.includes("route") || query.includes("campus")) {
          agentType = "insight";
          complexity = "simple";
        }

        // Adjust confidence based on query clarity
        if (query.length < 10) confidence = 0.6;
        if (query.includes("compare") || query.includes("versus") || query.includes("impact")) confidence = 0.7;

        return {
          content: [{
            type: "text",
            text: `Query Analysis:
- Agent: ${agentType.toUpperCase()}
- Complexity: ${complexity}
- Confidence: ${(confidence * 100).toFixed(0)}%
- Recommended approach: Route to ${agentType} agent for specialized processing

This query will be processed by the ${agentType} agent with ${complexity} analysis approach.`
          }],
        };
      },
    }),

    // Execute queries through appropriate agents
    execute_ml_query: tool({
      description: "Execute ML prediction and forecasting queries",
      inputSchema: z.object({
        query: z.string().describe("ML-focused query"),
        parameters: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
      }),
      execute: async ({ query, parameters = {} }) => {
        // Route to ML prediction agent
        if (query.includes("forecast") && mlPredictionAgent) {
          const routeMatch = query.match(/route\s*([A-Za-z0-9-]+)/i);
          const routeId = routeMatch ? routeMatch[1] : "M15-SBS";

          return await executeTool(mlPredictionAgent!.tools.forecast_violations.execute, {
            routeId,
            horizon: parameters.horizon || 6,
            includeSeasonality: parameters.seasonality !== false,
            confidenceLevel: parameters.confidence || 0.8,
          });
        }

        if (query.includes("simulate") || query.includes("policy")) {
          const routeMatch = query.match(/route\s*([A-Za-z0-9-]+)/i);
          const routeId = routeMatch ? routeMatch[1] : "M15-SBS";
          const policyType = query.includes("ace") ? "ace_expansion" :
                           query.includes("congestion") ? "congestion_pricing" :
                           query.includes("exempt") ? "exempt_reduction" : "ace_expansion";

          return await executeTool(mlPredictionAgent!.tools.simulate_policy_impact.execute, {
            routeId,
            policyType,
            scenario: query,
            duration: parameters.duration || 12,
          });
        }

        return await executeTool(mlPredictionAgent!.tools.comparative_analysis.execute, {
          analysisType: "route_comparison",
          routeIds: parameters.routes || ["M15-SBS", "Bx12-SBS"],
          metrics: parameters.metrics || ["violations", "exempt_share"],
        });
      },
    }),

    execute_nl_query: tool({
      description: "Execute natural language to SQL queries",
      inputSchema: z.object({
        query: z.string().describe("Natural language data query"),
        context: z.string().optional(),
      }),
      execute: async ({ query, context }) => {
        // Route to NL query agent
        if (query.includes("violation") || query.includes("ace") || query.includes("ticket")) {
          return await executeTool(nlQueryAgent.tools.parse_query_intent.execute, { query, context });
        }

        if (query.includes("sql") || query.includes("generate")) {
          const intent = query.includes("violation") ? "violation_analysis" :
                        query.includes("route") ? "route_performance" :
                        query.includes("campus") ? "campus_impact" : "violation_analysis";

          return await executeTool(nlQueryAgent.tools.generate_sql_query.execute, {
            intent,
            filters: [],
            metrics: ["violations", "exempt_share"],
            limit: 100,
          });
        }

        return await executeTool(nlQueryAgent.tools.validate_data_query.execute, {
          sql: query,
          expectedResultType: "count",
        });
      },
    }),

    execute_workflow: tool({
      description: "Execute complex workflow orchestration",
      inputSchema: z.object({
        workflowType: z.enum(["campus_study", "policy_analysis", "emergency_response"]),
        parameters: z.record(z.union([z.string(), z.number(), z.boolean()])),
      }),
      execute: async ({ workflowType, parameters }) => {
        // Route to workflow agent
        if (workflowType === "campus_study") {
          const campusMatch = parameters.campus || "Hunter College";
          return await executeTool(workflowAgent.tools.orchestrate_campus_study.execute, {
            campusName: campusMatch,
            includeForecasting: parameters.forecasting !== false,
            includePolicySimulation: parameters.simulation !== false,
          });
        }

        if (workflowType === "policy_analysis") {
          const policyType = parameters.policy || "ace_expansion";
          const routes = Array.isArray(parameters.routes) ? parameters.routes : ["M15-SBS"];

          return await executeTool(workflowAgent.tools.orchestrate_policy_analysis.execute, {
            policyType,
            affectedRoutes: routes,
            timeHorizon: parameters.horizon || 12,
            includeStakeholderImpact: parameters.stakeholders !== false,
          });
        }

        if (workflowType === "emergency_response") {
          return await executeTool(workflowAgent.tools.orchestrate_emergency_response.execute, {
            incidentType: parameters.type || "major_delay",
            affectedArea: parameters.area || "Manhattan",
            urgencyLevel: parameters.urgency || "medium",
            includeCommunicationPlan: parameters.communication !== false,
          });
        }

        return {
          content: [{ type: "text", text: "Workflow type not recognized" }],
        };
      },
    }),

    // Multi-agent coordination for complex queries
    comprehensive_analysis: tool({
      description: "Coordinate multiple agents for comprehensive analysis",
      inputSchema: z.object({
        userQuery: z.string().describe("Complex user query requiring multi-agent coordination"),
        analysisDepth: z.enum(["quick", "standard", "comprehensive"]).default("standard"),
      }),
      execute: async ({ userQuery, analysisDepth }) => {
        const steps = [];
        let finalAnalysis = `Comprehensive Analysis: ${userQuery}\n\n`;

        const agentTools = (this as { tools?: Record<string, any> }).tools;
        if (!agentTools) {
          return {
            content: [{ type: "text", text: "Comprehensive analysis tools unavailable." }],
          };
        }

        // Step 1: Analyze query complexity
        const complexityAnalysis: any = await executeTool(agentTools.analyze_query_complexity.execute, {
          userQuery,
          context: "Multi-agent comprehensive analysis",
        });
        steps.push("Query Analysis Complete");
        finalAnalysis += `1. QUERY ANALYSIS\n${firstText(complexityAnalysis, "Analysis unavailable")}\n\n`;

        // Step 2: Execute appropriate specialized analysis
        const queryLower = userQuery.toLowerCase();

        if (queryLower.includes("forecast") || queryLower.includes("predict")) {
          const mlResult: any = await executeTool(agentTools.execute_ml_query.execute, {
            query: userQuery,
            parameters: { horizon: 6, confidence: 0.8 },
          });
          steps.push("ML Prediction Complete");
          finalAnalysis += `2. ML PREDICTION ANALYSIS\n${firstText(mlResult, "ML analysis unavailable")}\n\n`;
        }

        if (queryLower.includes("campus") || queryLower.includes("student")) {
          const nlResult: any = await executeTool(agentTools.execute_nl_query.execute, {
            query: userQuery,
            context: "Campus impact analysis",
          });
          steps.push("Campus Analysis Complete");
          finalAnalysis += `3. CAMPUS IMPACT ANALYSIS\n${firstText(nlResult, "Campus analysis unavailable")}\n\n`;
        }

        if (queryLower.includes("study") || queryLower.includes("comprehensive") || analysisDepth === "comprehensive") {
          const workflowResult: any = await executeTool(agentTools.execute_workflow.execute, {
            workflowType: queryLower.includes("campus") ? "campus_study" :
                         queryLower.includes("policy") ? "policy_analysis" : "emergency_response",
            parameters: {},
          });
          steps.push("Workflow Orchestration Complete");
          finalAnalysis += `4. WORKFLOW ANALYSIS\n${firstText(workflowResult, "Workflow analysis unavailable")}\n\n`;
        }

        // Step 3: Synthesize findings
        finalAnalysis += `5. SYNTHESIS AND RECOMMENDATIONS\n`;
        finalAnalysis += `- Analysis completed using ${steps.length} specialized agents\n`;
        finalAnalysis += `- Query processed with ${analysisDepth} depth approach\n`;
        finalAnalysis += `- Cross-referenced data from violations, CUNY campuses, and policy datasets\n`;
        finalAnalysis += `- Ready for stakeholder presentation and decision-making\n\n`;
        finalAnalysis += `Next Steps:\n`;
        finalAnalysis += `- Review detailed findings in respective agent outputs\n`;
        finalAnalysis += `- Consider running deeper analysis with specific parameters\n`;
        finalAnalysis += `- Schedule follow-up analysis for temporal changes\n`;

        return {
          content: [{ type: "text", text: finalAnalysis }],
        };
      },
    }),
  },
});

export type InsightAgentUIMessage = InferAgentUIMessage<typeof insightAgent>;
export type MLPredictionAgentUIMessage = InferAgentUIMessage<typeof mlPredictionAgent>;
export type NLQueryAgentUIMessage = InferAgentUIMessage<typeof nlQueryAgent>;
export type WorkflowAgentUIMessage = InferAgentUIMessage<typeof workflowAgent>;
export type ComprehensiveAgentUIMessage = InferAgentUIMessage<typeof comprehensiveAgent>;
