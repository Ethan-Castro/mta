import { NextResponse } from "next/server";
import { z } from "zod";
import { getHotspots } from "@/lib/data/violations";

const QuerySchema = z.object({
  routeId: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(40),
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
      return NextResponse.json({ ok: false, error: parse.error.flatten() }, { status: 400 });
    }

    const hotspots = await getHotspots(parse.data);
    return NextResponse.json({ ok: true, rows: hotspots });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Unable to load hotspots" }, { status: 500 });
  }
}
