import { NextResponse } from "next/server";
import { z } from "zod";
import { getRouteTotals } from "@/lib/data/violations";

const QuerySchema = z.object({
  routeId: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(25),
  orderBy: z.enum(["violations", "exempt_share", "route"]).optional(),
  direction: z.enum(["asc", "desc"]).optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parse = QuerySchema.safeParse({
      routeId: searchParams.get("routeId") || undefined,
      start: searchParams.get("start") || undefined,
      end: searchParams.get("end") || undefined,
      limit: searchParams.get("limit") || undefined,
      orderBy: searchParams.get("orderBy") || undefined,
      direction: searchParams.get("direction") || undefined,
    });

    if (!parse.success) {
      return NextResponse.json({ ok: false, error: parse.error.flatten() }, { status: 400 });
    }

    const routes = await getRouteTotals(parse.data);
    return NextResponse.json({ ok: true, rows: routes });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Unable to load routes" }, { status: 500 });
  }
}
