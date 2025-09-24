import { NextRequest, NextResponse } from "next/server";

const RAW_API = process.env.NEXT_PUBLIC_MTA_API ?? "https://mta-analytics-api-1.onrender.com";
const API = RAW_API.replace(/\/+$/, "");

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${API}/${path.join("/")}${req.nextUrl.search || ""}`;
  const res = await fetch(target, { cache: "no-store" });
  const data = await res.arrayBuffer();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${API}/${path.join("/")}`;
  const res = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
    cache: "no-store",
  });
  const data = await res.arrayBuffer();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
  });
}


