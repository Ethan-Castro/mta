// Minimal Neon Data API (PostgREST-compatible) client
// Reads base URL and optional bearer token from env

type QueryParams = Record<string, string | number | boolean | null | undefined>;

function getBaseUrl(): string {
  const base = process.env.NEON_DATA_API_URL;
  if (!base) {
    throw new Error("NEON_DATA_API_URL is not set. Provide your Data API endpoint.");
  }
  return base.replace(/\/$/, "");
}

function getAuthHeaders(): Record<string, string> {
  const token = process.env.NEON_DATA_API_TOKEN || process.env.NEON_DATA_API_KEY;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildQuery(params: QueryParams): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

export async function dataApiGet<T = any>({
  table,
  params = {},
  headers = {},
}: {
  table: string;
  params?: QueryParams;
  headers?: Record<string, string>;
}): Promise<T> {
  const url = `${getBaseUrl()}/${encodeURIComponent(table)}${buildQuery(params)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Data API GET ${table} failed: ${res.status} ${res.statusText} ${text}`);
  }
  return (await res.json()) as T;
}

export async function dataApiCount({
  table,
  filterParams = {},
}: {
  table: string;
  filterParams?: QueryParams;
}): Promise<number> {
  const params: QueryParams = { select: "count:count()", ...filterParams };
  const rows = await dataApiGet<Array<{ count: number | string }>>({ table, params });
  const countValue = rows?.[0]?.count ?? 0;
  return typeof countValue === "string" ? Number(countValue) : Number(countValue);
}

export function filterParamsFromDateRange({
  column,
  startISO,
  endISO,
}: {
  column: string | undefined;
  startISO?: string;
  endISO?: string;
}): QueryParams {
  const qp: QueryParams = {};
  if (column && startISO) qp[column] = `gte.${startISO}`;
  if (column && endISO) qp[column] = qp[column]
    ? `${String(qp[column])},lt.${endISO}` // combine with comma for AND on same column
    : `lt.${endISO}`;
  return qp;
}

export function eqFilter(column: string, value: string): QueryParams {
  return { [column]: `eq.${value}` } as QueryParams;
}


