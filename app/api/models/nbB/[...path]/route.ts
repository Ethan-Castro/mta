import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = (process.env.NEXT_PUBLIC_NOTEBOOK_B_BASE || process.env.NEXT_PUBLIC_ACE_API_BASE || process.env.NOTEBOOK_B_BASE || "").replace(/\/$/, "");

function ensureBase() {
  if (!BASE) {
    throw new Error("Notebook B base URL is not configured.");
  }
  return BASE;
}

function buildTarget(pathSegments: string[] | undefined, request: NextRequest): string {
  const suffix = (pathSegments ?? []).join("/");
  const search = request.nextUrl.search || "";
  const normalizedSuffix = suffix ? `/${suffix}` : "";
  return `${ensureBase()}${normalizedSuffix}${search}`;
}

function filterRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const forwardKeys = new Set([
    "content-type",
    "authorization",
    "accept",
    "accept-encoding",
    "cache-control",
  ]);
  request.headers.forEach((value, key) => {
    if (forwardKeys.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  return headers;
}

function buildResponseHeaders(response: Response): HeadersInit {
  const headers = new Headers();
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "content-length") return;
    headers.set(key, value);
  });
  headers.set("Access-Control-Allow-Origin", "*");
  return headers;
}

async function proxy(request: NextRequest, pathSegments: string[] | undefined) {
  try {
    const target = buildTarget(pathSegments, request);
    const method = request.method.toUpperCase();
    const headers = filterRequestHeaders(request);
    let body: BodyInit | undefined;
    if (method !== "GET" && method !== "HEAD") {
      const text = await request.text();
      if (text) {
        body = text;
      }
    }

    const upstream = await fetch(target, {
      method,
      headers,
      body,
      cache: method === "GET" ? undefined : "no-store",
    });

    const responseBody = await upstream.arrayBuffer();
    return new NextResponse(responseBody, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: buildResponseHeaders(upstream),
    });
  } catch (error) {
    console.error("Notebook B proxy error", error);
    return NextResponse.json({ error: "Notebook B proxy failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxy(request, params?.path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxy(request, params?.path);
}
