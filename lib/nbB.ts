const ENV_KEYS = ["NEXT_PUBLIC_NOTEBOOK_B_BASE", "NEXT_PUBLIC_ACE_API_BASE", "NOTEBOOK_B_BASE"] as const;

function resolveBase(): string {
  for (const key of ENV_KEYS) {
    const value = process.env[key];
    if (value && value.trim()) {
      return value.replace(/\/$/, "");
    }
  }
  throw new Error("Notebook B base URL is not configured (set NEXT_PUBLIC_NOTEBOOK_B_BASE).");
}

const BASE_URL = resolveBase();

async function handleResponse<T>(res: Response, path: string): Promise<T> {
  if (!res.ok) {
    const message = `Notebook B ${res.status} ${path}`;
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

function buildUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

async function get<T>(path: string, options: { revalidate?: number } = {}): Promise<T> {
  const { revalidate } = options;
  const init: RequestInit & { next?: { revalidate?: number } } = { method: "GET" };
  if (typeof window === "undefined" && revalidate !== undefined) {
    init.next = { revalidate };
  }
  const res = await fetch(buildUrl(path), init);
  return handleResponse<T>(res, path);
}

export type NotebookBHealth = {
  ok?: boolean;
  artifacts?: Record<string, boolean>;
  [key: string]: unknown;
};

let healthPromise: Promise<NotebookBHealth | null> | null = null;

export async function health(): Promise<NotebookBHealth | null> {
  if (!healthPromise) {
    healthPromise = (async () => {
      try {
        return await get<NotebookBHealth>("/health", { revalidate: 60 });
      } catch (error) {
        console.warn("Notebook B health check failed", error);
        return null;
      }
    })();
  }
  return healthPromise;
}

export async function routes<T = unknown>(): Promise<T> {
  return get<T>("/routes", { revalidate: 600 });
}

export async function forecast<T = unknown>(routeId: string): Promise<T> {
  const safeId = encodeURIComponent(routeId);
  return get<T>(`/forecast/${safeId}`, { revalidate: 300 });
}

export async function riskTop<T = unknown>(limit: number): Promise<T> {
  const capped = Math.min(200, Math.max(1, Math.round(limit)));
  return get<T>(`/risk/top?limit=${capped}`, { revalidate: 300 });
}

export async function riskScore<T = unknown>(avgSpeedMph: number, tripsPerHour: number): Promise<T> {
  const qs = new URLSearchParams({
    avg_speed_mph: String(avgSpeedMph),
    trips_per_hour: String(tripsPerHour),
  }).toString();
  const res = await fetch(`${BASE_URL}/risk/score?${qs}`, {
    cache: "no-store",
  });
  return handleResponse<T>(res, "/risk/score");
}

export async function hotspots<T = unknown>(): Promise<T> {
  return get<T>("/hotspots.geojson", { revalidate: 600 });
}

export async function survivalKm<T = unknown>(): Promise<T> {
  return get<T>("/survival/km", { revalidate: 600 });
}

export async function survivalCox<T = unknown>(): Promise<T> {
  return get<T>("/survival/cox_summary", { revalidate: 600 });
}

export const notebookB = {
  baseUrl: BASE_URL,
  health,
  routes,
  forecast,
  riskTop,
  riskScore,
  hotspots,
  survivalKm,
  survivalCox,
};

export default notebookB;
