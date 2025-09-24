import { tool } from "ai";
import { z } from "zod";
import type { FeatureCollection } from "geojson";
import type { ForecastPayload, RiskRow } from "@/lib/aceApi";

const TOOL_ARTIFACT_MAP: Record<string, string> = {
  forecastRoute: "forecast",
  riskTop: "risk_top",
  riskScore: "risk_score",
  hotspotsMap: "hotspots",
  survivalKm: "survival_km",
  survivalCox: "survival_cox",
  createDocument: "document",
};

type HealthSnapshot = {
  ok?: boolean;
  artifacts?: Record<string, boolean>;
};

function normalizeBase(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/$/, "");
}

async function fetchHealth(base: string): Promise<HealthSnapshot | null> {
  try {
    const res = await fetch(`${base}/health`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as HealthSnapshot;
    return json ?? null;
  } catch (error) {
    console.warn("ACE health probe failed", error);
    return null;
  }
}

function shouldRegister(toolName: string, health: HealthSnapshot | null): boolean {
  const key = TOOL_ARTIFACT_MAP[toolName];
  if (!key) return true;
  const artifacts = health?.artifacts;
  if (!artifacts) return true;
  if (key in artifacts && artifacts[key] === false) {
    return false;
  }
  return true;
}

function toFriendlyError(message: string) {
  return { text: message };
}

function mapForecastToSeries(routeId: string, payload: ForecastPayload | null | undefined) {
  const rows = new Map<string, { label: string; History?: number | null; Forecast?: number | null; ciLow?: number | null; ciHigh?: number | null }>();
  const ensureRow = (label: string) => {
    const existing = rows.get(label);
    if (existing) return existing;
    const entry = { label } as { label: string; History?: number | null; Forecast?: number | null; ciLow?: number | null; ciHigh?: number | null };
    rows.set(label, entry);
    return entry;
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
      const value = values[i];
      const entry = ensureRow(label);
      const numeric = typeof value === "number" && Number.isFinite(value) ? value : null;
      entry[key] = numeric;
    }
  };

  if (!payload) {
    return {
      chart: {
        type: "multi-line" as const,
        title: `Route ${routeId} violations forecast` as string,
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
  const mapped = (rows || []).map((row) => {
    const label = `${row.route_id}@${row.hour_of_day.toString().padStart(2, "0")}:00`;
    return {
      ...row,
      label,
      value: Number.isFinite(row.risk_score) ? Number(row.risk_score) : 0,
    };
  });
  return mapped;
}

function collectHotspotBars(geojson: FeatureCollection | null | undefined) {
  const features = Array.isArray(geojson?.features) ? geojson!.features : [];
  const counts = features
    .map((feature) => {
      const raw = (feature as any)?.properties?.count;
      const value = Number(raw ?? 0);
      return Number.isFinite(value) ? value : 0;
    })
    .filter((value) => value > 0)
    .sort((a, b) => b - a)
    .slice(0, 15);
  const rows = counts.map((value, index) => ({ label: `#${index + 1}`, value }));
  return { rows, total: features.length };
}

function mapSurvivalSeries(data: Array<Record<string, unknown>>) {
  const rows = (data || []).map((row) => {
    const label = String((row.time ?? row.label ?? "") || "");
    const survival = Number((row.survival ?? row.survival_prob ?? row.value) ?? 0);
    return {
      ...row,
      label,
      value: Number.isFinite(survival) ? survival : 0,
    };
  });
  return rows;
}

export async function buildAceTools(): Promise<Record<string, any>> {
  const base = normalizeBase(process.env.NEXT_PUBLIC_ACE_API_BASE);
  if (!base) return {};

  const health = await fetchHealth(base);
  const tools: Record<string, any> = {};

  const register = (name: string, factory: () => any) => {
    if (!shouldRegister(name, health)) return;
    tools[name] = factory();
  };

  register("forecastRoute", () =>
    tool({
      description: "Show route-level violations trend with near-term forecast.",
      inputSchema: z.object({ routeId: z.string().min(1) }),
      execute: async ({ routeId }) => {
        try {
          const res = await fetch(`${base}/forecast/${encodeURIComponent(routeId)}`, { cache: "no-store" });
          if (!res.ok) {
            if (res.status === 404 || res.status === 503) {
              return toFriendlyError(`Forecast for ${routeId} is not available right now.`);
            }
            return toFriendlyError(`Forecast request failed (${res.status}).`);
          }
          const payload = (await res.json()) as ForecastPayload | { chart?: unknown; data?: unknown };
          if (payload && typeof payload === "object" && "chart" in payload && "data" in payload) {
            return payload as { chart: unknown; data: unknown };
          }
          const packed = mapForecastToSeries(routeId, payload as ForecastPayload);
          return packed;
        } catch (error) {
          return toFriendlyError(`Forecast request failed: ${(error as Error)?.message ?? "unknown error"}`);
        }
      },
    })
  );

  register("riskTop", () =>
    tool({
      description: "Rank stop-hours for ACE camera placement by risk score.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(200).optional().default(50) }),
      execute: async ({ limit }) => {
        const capped = Math.min(200, Math.max(1, Number(limit ?? 50)));
        try {
          const res = await fetch(`${base}/risk/top?limit=${capped}`, { cache: "no-store" });
          if (!res.ok) {
            return toFriendlyError(res.status === 404 ? "Risk leaderboard is not available." : `Risk leaderboard request failed (${res.status}).`);
          }
          const rows = (await res.json()) as RiskRow[] | { chart?: unknown; data?: unknown };
          if (rows && typeof rows === "object" && "chart" in rows && "data" in rows) {
            return rows as { chart: unknown; data: unknown };
          }
          const enriched = buildRiskBarData(Array.isArray(rows) ? rows : []);
          return {
            chart: {
              type: "bar" as const,
              title: "Top candidate placements by risk",
              yLabel: "Risk score",
            },
            data: enriched,
          };
        } catch (error) {
          return toFriendlyError(`Risk leaderboard request failed: ${(error as Error)?.message ?? "unknown error"}`);
        }
      },
    })
  );

  register("riskScore", () =>
    tool({
      description: "Score a scenario with avg_speed_mph and trips_per_hour inputs.",
      inputSchema: z.object({
        avg_speed_mph: z.number().nonnegative(),
        trips_per_hour: z.number().nonnegative(),
      }),
      execute: async ({ avg_speed_mph, trips_per_hour }) => {
        try {
          const qs = new URLSearchParams({
            avg_speed_mph: String(avg_speed_mph),
            trips_per_hour: String(trips_per_hour),
          }).toString();
          const res = await fetch(`${base}/risk/score?${qs}`, { cache: "no-store" });
          if (!res.ok) {
            if (res.status === 503) {
              return toFriendlyError("Risk scoring model is warming up. Try again later.");
            }
            return toFriendlyError(`Risk scoring failed (${res.status}).`);
          }
          const payload = (await res.json()) as Record<string, unknown> & { risk_score?: number };
          const scoreValue = Number(payload?.risk_score ?? NaN);
          if (!Number.isFinite(scoreValue)) {
            return toFriendlyError("Risk scoring returned an invalid value.");
          }
          const chartData = [
            {
              label: "Risk score",
              value: scoreValue,
            },
          ];
          return {
            text: `Scenario risk score: **${scoreValue.toFixed(3)}**`,
            chart: {
              type: "bar" as const,
              title: "Scenario risk score",
              yLabel: "Risk score",
            },
            data: chartData.map((row) => ({ ...row, ...payload })),
          };
        } catch (error) {
          return toFriendlyError(`Risk scoring failed: ${(error as Error)?.message ?? "unknown error"}`);
        }
      },
    })
  );

  register("hotspotsMap", () =>
    tool({
      description: "Fetch ACE hotspots GeoJSON clusters with a quick histogram.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const res = await fetch(`${base}/hotspots.geojson`, { cache: "no-store" });
          if (!res.ok) {
            return toFriendlyError(res.status === 404 ? "No hotspots available right now." : `Hotspots request failed (${res.status}).`);
          }
          const geojson = (await res.json()) as FeatureCollection | { chart?: unknown; data?: unknown };
          if (geojson && typeof geojson === "object" && "chart" in geojson && "data" in geojson) {
            return geojson as { chart: unknown; data: unknown };
          }
          const { rows, total } = collectHotspotBars(geojson as FeatureCollection);
          return {
            chart: {
              type: "bar" as const,
              title: "Hotspot cluster counts (top 15)",
              yLabel: "Count",
              meta: {
                totalClusters: total,
              },
            },
            data: { rows, geojson },
          };
        } catch (error) {
          return toFriendlyError(`Hotspots request failed: ${(error as Error)?.message ?? "unknown error"}`);
        }
      },
    })
  );

  register("survivalKm", () =>
    tool({
      description: "Visualize time-to-repeat violation via Kaplan-Meier survival curve.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const res = await fetch(`${base}/survival/km`, { cache: "no-store" });
          if (!res.ok) {
            if (res.status === 404) {
              return toFriendlyError("Survival curve is not available right now.");
            }
            return toFriendlyError(`Survival curve request failed (${res.status}).`);
          }
          const payload = (await res.json()) as { data?: Array<Record<string, unknown>>; chart?: unknown } | Array<Record<string, unknown>>;
          if (payload && typeof payload === "object" && "chart" in payload && "data" in payload) {
            return payload as { chart: unknown; data: unknown };
          }
          const rowsArray = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
          const data = mapSurvivalSeries(rowsArray);
          return {
            chart: {
              type: "line" as const,
              title: "Time to repeat violation",
              yLabel: "Survival probability",
            },
            data,
          };
        } catch (error) {
          return toFriendlyError(`Survival curve request failed: ${(error as Error)?.message ?? "unknown error"}`);
        }
      },
    })
  );

  register("survivalCox", () =>
    tool({
      description: "Summarize covariate effects on repeat behavior (Cox model).",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const res = await fetch(`${base}/survival/cox_summary`, { cache: "no-store" });
          if (!res.ok) {
            if (res.status === 404) {
              return toFriendlyError("Cox model summary is not available right now.");
            }
            return toFriendlyError(`Cox model summary failed (${res.status}).`);
          }
          const payload = (await res.json()) as { columns?: string[]; rows?: Array<Record<string, unknown>> } | Record<string, unknown>;
          if (payload && typeof payload === "object" && "chart" in payload && "data" in payload) {
            return payload as { chart: unknown; data: unknown };
          }
          const rows = Array.isArray((payload as any)?.rows)
            ? (payload as any).rows
            : Array.isArray(payload)
            ? (payload as any)
            : [];
          return {
            chart: {
              type: "table" as const,
              title: "Cox model coefficients",
            },
            data: rows,
          };
        } catch (error) {
          return toFriendlyError(`Cox model summary failed: ${(error as Error)?.message ?? "unknown error"}`);
        }
      },
    })
  );

  register("createDocument", () =>
    tool({
      description: "Create a structured document with title, content, and optional actions using the Artifact component.",
      inputSchema: z.object({
        title: z.string().min(1).describe("The document title"),
        description: z.string().optional().describe("Optional description or subtitle"),
        content: z.string().min(1).describe("The main document content (supports markdown)"),
        actions: z.array(z.object({
          label: z.string().describe("Action button label"),
          tooltip: z.string().optional().describe("Tooltip text for the action"),
          type: z.enum(["copy", "download", "share", "edit"]).optional().describe("Type of action for default behavior")
        })).optional().describe("Optional array of action buttons")
      }),
      execute: async ({ title, description, content, actions = [] }) => {
        const formattedActions = actions.map(action => ({
          label: action.label,
          tooltip: action.tooltip || action.label,
          type: action.type || "copy"
        }));

        return {
          artifact: {
            title,
            description,
            content,
            actions: formattedActions,
            timestamp: new Date().toISOString()
          }
        };
      },
    })
  );

  return tools;
}
