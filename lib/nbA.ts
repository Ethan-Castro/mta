const ENV_KEYS = ["NEXT_PUBLIC_NOTEBOOK_A_BASE", "NOTEBOOK_A_BASE"] as const;

function resolveBase(): string {
  for (const key of ENV_KEYS) {
    const value = process.env[key];
    if (value && value.trim()) {
      return value.replace(/\/$/, "");
    }
  }
  throw new Error("Notebook A base URL is not configured (set NEXT_PUBLIC_NOTEBOOK_A_BASE).");
}

const BASE_URL = resolveBase();

async function handleResponse<T>(res: Response, path: string): Promise<T> {
  if (!res.ok) {
    const message = `Notebook A ${res.status} ${path}`;
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

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });
  return handleResponse<T>(res, path);
}

export type PredictSpeedInput = {
  month: number;
  hour: number;
  is_weekend: number | boolean;
  road_distance: number;
  distance_to_cuny: number;
  [key: string]: unknown;
};

export type PredictViolationsInput = {
  route_id: string;
  month?: number;
  hour?: number;
  is_weekend?: number | boolean;
  [key: string]: unknown;
};

export type AnalyzeRouteInput = {
  route_id: string;
  [key: string]: unknown;
};

export type NotebookAHealth = {
  ok?: boolean;
  speed_model?: boolean;
  speed_scaler?: boolean;
  violation_model?: boolean;
  [key: string]: unknown;
};

let healthPromise: Promise<NotebookAHealth | null> | null = null;

export async function health(): Promise<NotebookAHealth | null> {
  if (!healthPromise) {
    healthPromise = (async () => {
      try {
        return await get<NotebookAHealth>("/health", { revalidate: 60 });
      } catch (error) {
        console.warn("Notebook A health check failed", error);
        return null;
      }
    })();
  }
  return healthPromise;
}

export async function modelsInfo<T = unknown>(): Promise<T> {
  return get<T>("/models/info", { revalidate: 300 });
}

export async function predictSpeed<T = unknown>(body: PredictSpeedInput): Promise<T> {
  return post<T>("/predict/speed", body);
}

export async function predictViolations<T = unknown>(body: PredictViolationsInput): Promise<T> {
  return post<T>("/predict/violations", body);
}

export async function analyzeRoute<T = unknown>(body: AnalyzeRouteInput): Promise<T> {
  return post<T>("/analyze/route", body);
}

export const notebookA = {
  baseUrl: BASE_URL,
  health,
  modelsInfo,
  predictSpeed,
  predictViolations,
  analyzeRoute,
};

export default notebookA;
