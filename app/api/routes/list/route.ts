import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await sql`
      select distinct bus_route_id as id
      from violations
      where bus_route_id is not null
      order by 1
    `;
    const list = (rows as Array<{ id: string | null }>).map((r) => r.id).filter(Boolean);
    return NextResponse.json({ ok: true, rows: list });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unable to list routes" }, { status: 500 });
  }
}


