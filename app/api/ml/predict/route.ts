import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  // Placeholder: call to inference provider or local ONNX client
  return NextResponse.json({ ok: true, model: "speeds-forecast@0.0.1", at: new Date().toISOString() });
}


