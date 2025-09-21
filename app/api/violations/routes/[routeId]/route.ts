import { NextResponse } from "next/server";
import { z } from "zod";
import { getViolationSummary, getViolationTotals, getHotspots } from "@/lib/data/violations";

const QuerySchema = z.object({
  routeId: z.string(),
  start: z.string().optional(),
  end: z.string().optional(),
  limit: z.coerce.number().min(1).max(5000).default(5000),
});

export async function GET(req: Request, { params }: { params: Promise<{ routeId: string }> }) {
  try {
    const { routeId } = await params;
    const { searchParams } = new URL(req.url);
    const parse = QuerySchema.safeParse({
      routeId,
      start: searchParams.get("start") || undefined,
      end: searchParams.get("end") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    if (!parse.success) {
      return NextResponse.json({ ok: false, error: parse.error.flatten() }, { status: 400 });
    }

    const [summary, totals, hotspots] = await Promise.all([
      getViolationSummary(parse.data),
      getViolationTotals(parse.data),
      getHotspots({ ...parse.data, limit: 25 }),
    ]);

    return NextResponse.json({ ok: true, summary, totals, hotspots });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Unable to load route" }, { status: 500 });
  }
}
