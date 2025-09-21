import { NextResponse } from "next/server";
import { z } from "zod";
import { getViolationSummary } from "@/lib/data/violations";

export const runtime = "nodejs";

const QuerySchema = z.object({
  routeId: z.string().optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(50000).default(5000),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parse = QuerySchema.safeParse({
      routeId: searchParams.get("routeId") || undefined,
      start: searchParams.get("start") || undefined,
      end: searchParams.get("end") || undefined,
      limit: searchParams.get("limit") || undefined,
    });
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    const { routeId, start, end, limit } = parse.data;
    const rows = await getViolationSummary({ routeId, start, end, limit });

    return NextResponse.json({
      ok: true,
      rows: rows.map((row) => ({
        bus_route_id: row.busRouteId,
        date_trunc_ym: row.month,
        violations: row.violations,
        exempt_count: row.exemptCount,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

