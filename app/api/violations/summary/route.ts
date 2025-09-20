import { NextResponse } from "next/server";
import { z } from "zod";
import { createSocrataFromEnv } from "@/lib/data/socrata";

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
    const soda = createSocrataFromEnv();
    const datasetId = process.env.NY_ACE_DATASET_ID || "not-set";
    if (datasetId === "not-set") throw new Error("Missing NY_ACE_DATASET_ID");

    const filters: string[] = [];
    if (routeId) filters.push(`bus_route_id = '${routeId}'`);
    if (start) filters.push(`last_occurrence >= '${start}'`);
    if (end) filters.push(`last_occurrence < '${end}'`);

    const where = filters.length ? filters.join(" AND ") : undefined;

    // First query: overall counts
    const baseRows: Array<any> = await soda.get(datasetId, {
      $select: [
        "bus_route_id",
        "date_trunc_ym := date_trunc_ym(last_occurrence)",
        "count(violation_id) as violations",
      ].join(", "),
      $where: where,
      $group: "bus_route_id, date_trunc_ym",
      $order: "bus_route_id, date_trunc_ym",
      $limit: limit,
    });

    // Second query: exempt-only counts (merge client-side)
    const exWhere = [where, "violation_status = 'EXEMPT'"].filter(Boolean).join(" AND ");
    const exemptRows: Array<any> = await soda.get(datasetId, {
      $select: [
        "bus_route_id",
        "date_trunc_ym := date_trunc_ym(last_occurrence)",
        "count(violation_id) as exempt_count",
      ].join(", "),
      $where: exWhere,
      $group: "bus_route_id, date_trunc_ym",
      $order: "bus_route_id, date_trunc_ym",
      $limit: limit,
    });

    const key = (r: any) => `${r.bus_route_id}|${r.date_trunc_ym}`;
    const exMap = new Map(exemptRows.map((r) => [key(r), r] as const));
    const merged = baseRows.map((r) => ({ ...r, exempt_count: exMap.get(key(r))?.exempt_count ?? "0" }));

    return NextResponse.json({ ok: true, rows: merged });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}


