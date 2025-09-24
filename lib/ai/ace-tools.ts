import { tool } from "ai";
import { z } from "zod";
import type { FeatureCollection } from "geojson";
import {
  analyzeRoute,
  type AnalyzeRouteInput,
  health as healthA,
  predictSpeed,
  type PredictSpeedInput,
} from "@/lib/nbA";
import {
  forecast as fetchForecast,
  health as healthB,
  hotspots as fetchHotspots,
  riskScore as fetchRiskScore,
  riskTop as fetchRiskTop,
  survivalCox as fetchSurvivalCox,
  survivalKm as fetchSurvivalKm,
  type NotebookBHealth,
} from "@/lib/nbB";

const B_REQUIREMENTS: Record<string, string[]> = {
  forecastRoute: ["forecasts"],
  riskTop: ["xgb", "xgb_meta"],
  riskScore: ["xgb", "xgb_meta"],
  hotspotsMap: ["hotspots"],
  survivalKm: ["survival"],
  survivalCox: ["survival"],
};

const A_REQUIREMENTS: Record<string, string[]> = {
  predictSpeedNow: ["speed_model", "speed_scaler"],
  analyzeRouteNow: ["speed_model", "violation_model"],
};

type NotebookAHealth = {
  ok?: boolean;
  speed_model?: boolean;
  speed_scaler?: boolean;
  violation_model?: boolean;
  [key: string]: unknown;
};

function hasArtifacts(artifacts: Record<string, boolean> | undefined | null, requirements: string[]): boolean {
  if (!requirements.length) return true;
  if (!artifacts) return true;
  return requirements.every((key) => artifacts[key] !== false);
}

function toFriendlyError(message: string) {
  return { text: message };
}

type ForecastPayload = {
  history?: { date?: string[]; history?: Array<number | null> };
  forecast?: { date?: string[]; forecast?: Array<number | null> };
  ci_low?: { date?: string[]; ci_low?: Array<number | null> };
  ci_high?: { date?: string[]; ci_high?: Array<number | null> };
};

type RiskRow = {
  route_id: string;
  hour_of_day: number;
  risk_score: number;
  [key: string]: unknown;
};

function mapForecastToSeries(routeId: string, payload: ForecastPayload | null | undefined) {
  const rows = new Map<
    string,
    {
      label: string;
      History?: number | null;
      Forecast?: number | null;
      ciLow?: number | null;
      ciHigh?: number | null;
    }
  >();

  const ensureRow = (label: string) => {
    const entry = rows.get(label);
    if (entry) return entry;
    const next = { label } as {
      label: string;
      History?: number | null;
      Forecast?: number | null;
      ciLow?: number | null;
      ciHigh?: number | null;
    };
    rows.set(label, next);
    return next;
  };

  const addSeries = (
    dates: string[] | undefined,
    values: Array<number | null | undefined> | undefined,
    key: "History" | "Forecast" | "ciLow" | "ciHigh"
  ) => {
    if (!Array.isArray(dates) || !Array.isArray(values)) return;
    const limit = Math.min(dates.length, values.length);
    for (let i = 0; i < limit; i += 1) {
      const label = String(dates[i] ?? "");
      if (!label) continue;
      const numeric = typeof values[i] === "number" && Number.isFinite(values[i]) ? (values[i] as number) : null;
      ensureRow(label)[key] = numeric;
    }
  };

  if (!payload) {
    return {
      chart: {
        type: "multi-line" as const,
        title: `Route ${routeId} violations forecast`,
        series: ["History", "Forecast"],
        yLabel: "Violations per day",
      },
      data: [] as Array<Record<string, unknown>>,
    };
  }

  addSeries(payload.history?.date, payload.history?.history, "History");
  addSeries(payload.forecast?.date, payload.forecast?.forecast, "Forecast");
  addSeries(payload.ci_low?.date ?? payload.forecast?.date, payload.ci_low?.ci_low, "ciLow");
  addSeries(payload.ci_high?.date ?? payload.forecast?.date, payload.ci_high?.ci_high, "ciHigh");

  const data = Array.from(rows.values()).sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));

  return {
    chart: {
      type: "multi-line" as const,
      title: `Route ${routeId} violations forecast`,
      series: ["History", "Forecast"],
      yLabel: "Violations per day",
      intervalKeys: data.some((row) => typeof row.ciLow === "number" && typeof row.ciHigh === "number")
        ? { low: "ciLow", high: "ciHigh" }
        : undefined,
    },
    data,
  };
}

function buildRiskBarData(rows: RiskRow[]) {
  return (rows || []).map((row) => ({
    ...row,
    label: `${row.route_id}@${row.hour_of_day.toString().padStart(2, "0")}:00`,
    value: Number.isFinite(row.risk_score) ? Number(row.risk_score) : 0,
  }));
}

function collectHotspotBars(geojson: FeatureCollection | null | undefined) {
  const features = Array.isArray(geojson?.features) ? geojson.features : [];
  const counts = features
    .map((feature) => Number((feature as any)?.properties?.count ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => b - a)
    .slice(0, 15);
  const rows = counts.map((value, index) => ({ label: `#${index + 1}`, value }));
  return { rows, total: features.length };
}

function mapSurvivalSeries(data: Array<Record<string, unknown>>) {
  return (data || []).map((row) => ({
    ...row,
    label: String((row.time ?? row.label ?? "") || ""),
    value: Number.isFinite(Number(row.survival ?? row.survival_prob ?? row.value))
      ? Number(row.survival ?? row.survival_prob ?? row.value)
      : 0,
  }));
}

function gateB(health: NotebookBHealth | null, toolName: keyof typeof B_REQUIREMENTS) {
  if (!health) return false;
  if (health.ok === false) return false;
  return hasArtifacts(health.artifacts, B_REQUIREMENTS[toolName] ?? []);
}

function gateA(health: NotebookAHealth | null, toolName: keyof typeof A_REQUIREMENTS) {
  if (!health) return false;
  if (health.ok === false) return false;
  return A_REQUIREMENTS[toolName].every((key) => (health as Record<string, unknown>)[key] !== false);
}

export async function buildAceTools(): Promise<Record<string, any>> {
  const [aResult, bResult] = await Promise.allSettled([healthA(), healthB()]);
  const nbAHealth = aResult.status === "fulfilled" ? aResult.value : null;
  const nbBHealth = bResult.status === "fulfilled" ? bResult.value : null;
  const tools: Record<string, any> = {};

  const register = (name: string, factory: () => any) => {
    tools[name] = factory();
  };

  if (gateB(nbBHealth, "forecastRoute")) {
    register("forecastRoute", () =>
      tool({
        description: "Show route-level violations trend with near-term forecast.",
        inputSchema: z.object({ routeId: z.string().min(1) }),
        execute: async ({ routeId }) => {
          try {
            const payload = await fetchForecast<ForecastPayload>(routeId);
            return mapForecastToSeries(routeId, payload);
          } catch (error: any) {
            const message = error instanceof Error ? error.message : String(error);
            if (/404/.test(message)) {
              return toFriendlyError(`Forecast for ${routeId} is not available right now.`);
            }
            return toFriendlyError(`Forecast request failed (${message}).`);
          }
        },
      })
    );
  }

  if (gateB(nbBHealth, "riskTop")) {
    register("riskTop", () =>
      tool({
        description: "Rank stop-hours for ACE camera placement by risk score.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(200).optional().default(50) }),
        execute: async ({ limit }) => {
          try {
            const rows = await fetchRiskTop<RiskRow[]>(limit ?? 50);
            const data = buildRiskBarData(Array.isArray(rows) ? rows : []);
            return {
              chart: {
                type: "bar" as const,
                title: "Top candidate placements by risk",
                yLabel: "Risk score",
              },
              data,
            };
          } catch (error: any) {
            const message = error instanceof Error ? error.message : String(error);
            return toFriendlyError(`Risk leaderboard request failed (${message}).`);
          }
        },
      })
    );
  }

  if (gateB(nbBHealth, "riskScore")) {
    register("riskScore", () =>
      tool({
        description: "Score a scenario: avg_speed_mph & trips_per_hour.",
        inputSchema: z.object({
          avg_speed_mph: z.number().nonnegative(),
          trips_per_hour: z.number().nonnegative(),
        }),
        execute: async ({ avg_speed_mph, trips_per_hour }) => {
          try {
            const result = await fetchRiskScore<Record<string, unknown>>(avg_speed_mph, trips_per_hour);
            const value = Number((result as any)?.risk_score ?? NaN);
            if (!Number.isFinite(value)) {
              return toFriendlyError("Risk scoring returned an invalid value.");
            }
            return {
              text: `Scenario risk score: **${value.toFixed(3)}**`,
              chart: {
                type: "bar" as const,
                title: "Scenario risk score",
                yLabel: "Risk score",
              },
              data: [
                {
                  label: "Risk score",
                  value,
                },
              ],
              meta: result,
            };
          } catch (error: any) {
            const message = error instanceof Error ? error.message : String(error);
            if (/503/.test(message)) {
              return toFriendlyError("Risk scoring model is warming up. Try again later.");
            }
            return toFriendlyError(`Risk scoring failed (${message}).`);
          }
        },
      })
    );
  }

  if (gateB(nbBHealth, "hotspotsMap")) {
    register("hotspotsMap", () =>
      tool({
        description: "Fetch ACE hotspots GeoJSON clusters with a quick histogram.",
        inputSchema: z.object({}),
        execute: async () => {
          try {
            const geojson = await fetchHotspots<FeatureCollection>();
            const { rows, total } = collectHotspotBars(geojson);
            return {
              chart: {
                type: "bar" as const,
                title: "Hotspot cluster counts",
                yLabel: "Count",
                meta: { totalClusters: total },
              },
              data: { rows, geojson },
            };
          } catch (error: any) {
            const message = error instanceof Error ? error.message : String(error);
            if (/404/.test(message)) {
              return toFriendlyError("No hotspots available right now.");
            }
            return toFriendlyError(`Hotspots request failed (${message}).`);
          }
        },
      })
    );
  }

  if (gateB(nbBHealth, "survivalKm")) {
    register("survivalKm", () =>
      tool({
        description: "Visualize time-to-repeat violation via survival curve.",
        inputSchema: z.object({}),
        execute: async () => {
          try {
            const response = await fetchSurvivalKm<any>();
            const rows = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
            return {
              chart: {
                type: "line" as const,
                title: "Time to repeat violation",
                yLabel: "Survival probability",
              },
              data: mapSurvivalSeries(rows),
            };
          } catch (error: any) {
            const message = error instanceof Error ? error.message : String(error);
            if (/404/.test(message)) {
              return toFriendlyError("Survival curve is not available right now.");
            }
            return toFriendlyError(`Survival curve request failed (${message}).`);
          }
        },
      })
    );
  }

  if (gateB(nbBHealth, "survivalCox")) {
    register("survivalCox", () =>
      tool({
        description: "Summarize covariate effects on repeat behavior (Cox model).",
        inputSchema: z.object({}),
        execute: async () => {
          try {
            const result = await fetchSurvivalCox<any>();
            const rows = Array.isArray(result?.rows) ? result.rows : Array.isArray(result) ? result : [];
            return {
              chart: {
                type: "table",
                title: "Cox model coefficients",
              },
              data: rows,
            };
          } catch (error: any) {
            const message = error instanceof Error ? error.message : String(error);
            if (/404/.test(message)) {
              return toFriendlyError("Cox model summary is not available right now.");
            }
            return toFriendlyError(`Cox model summary failed (${message}).`);
          }
        },
      })
    );
  }

  if (gateA(nbAHealth, "predictSpeedNow")) {
    register("predictSpeedNow", () =>
      tool({
        description: "Predict bus speed under specified conditions.",
        inputSchema: z.object({
          month: z.number().int().min(1).max(12),
          hour: z.number().int().min(0).max(23),
          is_weekend: z.union([z.boolean(), z.number().int().min(0).max(1)]),
          road_distance: z.number().nonnegative(),
          distance_to_cuny: z.number().nonnegative(),
        }),
        execute: async (input: PredictSpeedInput) => {
          try {
            const result = await predictSpeed<Record<string, any>>(input);
            const speed = Number(result?.prediction?.speed_mph ?? result?.prediction?.speed ?? NaN);
            if (!Number.isFinite(speed)) {
              return toFriendlyError("Speed model returned an invalid value.");
            }
            const label = String(result?.prediction?.traffic_level ?? "speed");
            const range = result?.prediction?.confidence_interval;
            const textParts = [`Estimated speed: **${speed.toFixed(2)} mph** (${label})`];
            if (Array.isArray(range) && range.length === 2) {
              textParts.push(`95% CI: ${range[0]} – ${range[1]} mph`);
            }
            return {
              text: textParts.join(" | "),
              chart: {
                type: "bar" as const,
                title: "Predicted speed",
                yLabel: "mph",
              },
              data: [
                {
                  label: "Speed",
                  value: speed,
                },
              ],
              meta: result,
            };
          } catch (error: any) {
            const message = error instanceof Error ? error.message : String(error);
            return toFriendlyError(`Speed prediction failed (${message}).`);
          }
        },
      })
    );
  }

  if (gateA(nbAHealth, "analyzeRouteNow")) {
    register("analyzeRouteNow", () =>
      tool({
        description: "Run a quick analysis for a specified route (speed + expected violations).",
        inputSchema: z.object({
          route_id: z.string().min(1),
        }),
        execute: async ({ route_id }: AnalyzeRouteInput) => {
          try {
            const result = await analyzeRoute<Record<string, any>>({ route_id });
            const analysis = result?.analysis ?? {};
            const speedValue = Number(analysis?.predictions?.current_speed?.value ?? NaN);
            const violationsValue = Number(analysis?.predictions?.expected_violations_today?.value ?? NaN);
            const bullets: string[] = [];
            const recommendations: Array<Record<string, unknown>> = Array.isArray(analysis?.recommendations)
              ? (analysis.recommendations as Array<Record<string, unknown>>)
              : [];
            if (Array.isArray(recommendations) && recommendations.length) {
              for (const rec of recommendations) {
                const action = rec?.action ? `**${String(rec.action)}**` : "Recommendation";
                const reason = rec?.reason ? ` — ${String(rec.reason)}` : "";
                bullets.push(`${action}${reason}`);
              }
            }
            if (!bullets.length) {
              bullets.push("No specific recommendations were returned.");
            }

            const metrics = [
              Number.isFinite(speedValue)
                ? { label: "Speed (mph)", value: speedValue }
                : null,
              Number.isFinite(violationsValue)
                ? { label: "Expected violations", value: violationsValue }
                : null,
            ].filter(Boolean) as Array<{ label: string; value: number }>;

            return {
              text: bullets.join("\n"),
              chart: metrics.length
                ? {
                    type: "bar" as const,
                    title: "Route analysis",
                    yLabel: metrics.length === 1 ? metrics[0]!.label : undefined,
                  }
                : undefined,
              data: metrics.length
                ? metrics.map((metric) => ({ label: metric.label, value: metric.value }))
                : [],
              meta: result,
            };
          } catch (error: any) {
            const message = error instanceof Error ? error.message : String(error);
            return toFriendlyError(`Route analysis failed (${message}).`);
          }
        },
      })
    );
  }

  return tools;
}

export default buildAceTools;
