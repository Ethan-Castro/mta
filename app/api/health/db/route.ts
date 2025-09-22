import { NextResponse } from "next/server";
import { healthcheck } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ok = await healthcheck();
    return NextResponse.json({ ok });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "db error" }, { status: 500 });
  }
}


