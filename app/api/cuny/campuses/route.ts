import { NextResponse } from "next/server";
import { getCampuses } from "@/lib/data/cuny";

export async function GET() {
  try {
    const campuses = await getCampuses();
    return NextResponse.json({ ok: true, campuses });
  } catch (error: any) {
    console.error("/api/cuny/campuses failed", error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Unable to load campuses" },
      { status: 500 }
    );
  }
}
