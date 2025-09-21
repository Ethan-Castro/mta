import { NextResponse } from "next/server";
import { z } from "zod";
import { getExemptRepeaters } from "@/lib/data/violations";

const QuerySchema = z.object({
  routeId: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(20),
  minOccurrences: z.coerce.number().min(1).max(100).default(5),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parse = QuerySchema.safeParse({
      routeId: searchParams.get("routeId") || undefined,
      start: searchParams.get("start") || undefined,
      end: searchParams.get("end") || undefined,
      limit: searchParams.get("limit") || undefined,
      minOccurrences: searchParams.get("minOccurrences") || undefined,
    });

    if (!parse.success) {
      return NextResponse.json({ ok: false, error: parse.error.flatten() }, { status: 400 });
    }

    const repeaters = await getExemptRepeaters(parse.data);
    return NextResponse.json({ ok: true, rows: repeaters });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Unable to load repeaters" }, { status: 500 });
  }
}
