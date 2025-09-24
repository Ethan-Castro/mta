import type { FeatureCollection } from "geojson";

const BASE = process.env.NEXT_PUBLIC_ACE_API_BASE ?? "https://mta-ace-api-1.onrender.com";
if (!BASE) throw new Error("NEXT_PUBLIC_ACE_API_BASE is not set");

export type ForecastArrays = { date: string[]; history?: number[]; forecast?: number[]; ci_low?: number[]; ci_high?: number[] };
export type ForecastPayload = { history: ForecastArrays; forecast: ForecastArrays; ci_low?: ForecastArrays; ci_high?: ForecastArrays };

export type RiskRow = {
  route_id: string;
  timepoint_stop_id: string;
  hour_of_day: number;
  avg_speed_mph: number;
  trips_per_hour: number;
  risk_score: number;
  rank_in_route: number;
};

export class ModelApiError extends Error {
  constructor(
    public readonly path: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly url: string,
    public readonly responseText: string
  ) {
    super(`Model API ${path} → ${status} ${statusText}\nURL: ${url}\nResponse: ${responseText}`);
    this.name = "ModelApiError";
  }
}

async function get<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unable to read error response");
    throw new ModelApiError(path, res.status, res.statusText, url, errorText);
  }
  return res.json() as Promise<T>;
}

export const aceApi = {
  health: () => get<{ ok: boolean; snapshot?: any; artifacts: Record<string, boolean> }>("/health"),
  forecast: async (routeId: string): Promise<ForecastPayload | null> => {
    try {
      return await get<ForecastPayload>(`/forecast/${encodeURIComponent(routeId)}`);
    } catch (error) {
      if (error instanceof ModelApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },
  riskTop: (limit = 100) => get<RiskRow[]>(`/risk/top?limit=${limit}`),
  riskScore: (avgSpeedMph: number, tripsPerHour: number) =>
    get<{ risk_score: number }>(`/risk/score?avg_speed_mph=${avgSpeedMph}&trips_per_hour=${tripsPerHour}`),
  hotspots: () => get<FeatureCollection>(`/hotspots.geojson`),
  survivalKm: () => get<Record<string, unknown>>(`/survival/km`), // optional
  survivalCox: () => get<Record<string, unknown>>(`/survival/cox_summary`), // optional
};
