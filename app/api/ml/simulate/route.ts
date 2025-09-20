import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  // Placeholder: create remote simulation job and return id
  return NextResponse.json({ ok: true, jobId: `sim-${Date.now()}` });
}


