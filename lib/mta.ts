export const MTA_API = process.env.NEXT_PUBLIC_MTA_API || "/api/mta";

type Json = Record<string, any>;

export async function postJSON<T = any>(
  path: string,
  body: Json,
  signal?: AbortSignal
): Promise<T> {
  const url = `${MTA_API}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data && (data as any).success === false)) {
    const msg = (data as any)?.error || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export async function getJSON<T = any>(path: string): Promise<T> {
  const url = `${MTA_API}${path}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}


