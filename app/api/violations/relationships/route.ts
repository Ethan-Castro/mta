import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

const QuerySchema = z.object({
  minOccurrences: z.coerce.number().min(1).max(100).default(5),
  start: z.string().optional(),
  end: z.string().optional(),
});

function toIsoOrUndefined(value?: string | null) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parse = QuerySchema.safeParse({
      minOccurrences: searchParams.get("minOccurrences") || undefined,
      start: searchParams.get("start") || undefined,
      end: searchParams.get("end") || undefined,
    });
    if (!parse.success) {
      return NextResponse.json({ ok: false, error: parse.error.flatten() }, { status: 400 });
    }

    const { minOccurrences, start, end } = parse.data;
    const filters: any[] = [sql`vehicle_id is not null`, sql`bus_route_id is not null`];
    const startIso = toIsoOrUndefined(start);
    if (startIso) filters.push(sql`last_occurrence >= ${startIso}`);
    const endIso = toIsoOrUndefined(end);
    if (endIso) filters.push(sql`last_occurrence < ${endIso}`);
    const whereClause = filters.slice(1).reduce((acc, clause) => sql`${acc} and ${clause}`, filters[0]);

    const rows = await sql`
      select
        vehicle_id,
        bus_route_id,
        count(*)::int as events
      from violations
      where ${whereClause}
      group by vehicle_id, bus_route_id
      having count(*) >= ${Math.max(1, minOccurrences)}
      order by events desc
      limit 5000
    `;

    return NextResponse.json({ ok: true, edges: rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unable to compute relationships" }, { status: 500 });
  }
}


