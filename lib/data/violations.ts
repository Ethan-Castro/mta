import { sql, isDbConfigured } from "@/lib/db";

export type ViolationSummaryParams = {
  routeId?: string;
  start?: string;
  end?: string;
  limit?: number;
};

export type ViolationSummaryRow = {
  busRouteId: string;
  month: string;
  violations: number;
  exemptCount: number;
};

function coerceIso(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export async function getViolationSummary({
  routeId,
  start,
  end,
  limit = 5000,
}: ViolationSummaryParams): Promise<ViolationSummaryRow[]> {
  const filters: any[] = [];
  if (routeId) {
    filters.push(sql`bus_route_id = ${routeId}`);
  }
  const startIso = coerceIso(start);
  if (startIso) {
    filters.push(sql`last_occurrence >= ${startIso}`);
  }
  const endIso = coerceIso(end);
  if (endIso) {
    filters.push(sql`last_occurrence < ${endIso}`);
  }

  let whereClause: any = null;
  if (filters.length === 1) {
    whereClause = filters[0];
  } else if (filters.length > 1) {
    whereClause = filters.slice(1).reduce((acc, clause) => sql`${acc} and ${clause}`, filters[0]);
  }

  const rows = await sql`
    select
      coalesce(bus_route_id, 'UNKNOWN') as bus_route_id,
      to_char(date_trunc('month', last_occurrence), 'YYYY-MM-01') as month,
      count(*)::text as violations,
      sum(case when violation_status = 'EXEMPT' then 1 else 0 end)::text as exempt_count
    from violations
    ${whereClause ? sql`where ${whereClause}` : sql``}
    group by 1, 2
    order by 2 desc, 1 asc
    limit ${Math.max(1, Math.min(limit, 50000))}
  `;

  return (rows as Array<{
    bus_route_id: string | null;
    month: string | null;
    violations: string;
    exempt_count: string;
  }>).map((row) => ({
    busRouteId: row.bus_route_id ?? "UNKNOWN",
    month: row.month ?? "",
    violations: Number(row.violations ?? "0"),
    exemptCount: Number(row.exempt_count ?? "0"),
  }));
}

export async function getViolationTotals(params: ViolationSummaryParams) {
  const summary = await getViolationSummary(params);
  const totals = summary.reduce(
    (acc, row) => {
      acc.violations += row.violations;
      acc.exempt += row.exemptCount;
      acc.routes.add(row.busRouteId);
      acc.months.add(row.month);
      return acc;
    },
    { violations: 0, exempt: 0, routes: new Set<string>(), months: new Set<string>() }
  );
  const monthsSorted = Array.from(totals.months).filter(Boolean).sort();
  return {
    totalViolations: totals.violations,
    totalExempt: totals.exempt,
    routes: totals.routes,
    months: monthsSorted,
  };
}

export type RouteTotalsRow = {
  busRouteId: string;
  violations: number;
  exemptCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
};

export async function getRouteTotals({
  limit = 25,
  orderBy = "violations",
  direction = "desc",
  routeId,
  start,
  end,
}: ViolationSummaryParams & {
  limit?: number;
  orderBy?: "violations" | "exempt_share" | "route";
  direction?: "asc" | "desc";
}): Promise<RouteTotalsRow[]> {
  const filters: any[] = [];
  if (routeId) {
    filters.push(sql`bus_route_id = ${routeId}`);
  }
  const startIso = coerceIso(start);
  if (startIso) {
    filters.push(sql`last_occurrence >= ${startIso}`);
  }
  const endIso = coerceIso(end);
  if (endIso) {
    filters.push(sql`last_occurrence < ${endIso}`);
  }

  let whereClause: any = null;
  if (filters.length === 1) {
    whereClause = filters[0];
  } else if (filters.length > 1) {
    whereClause = filters.slice(1).reduce((acc, clause) => sql`${acc} and ${clause}`, filters[0]);
  }

  const orderFragment =
    orderBy === "route"
      ? sql`bus_route_id ${direction === "asc" ? sql`asc` : sql`desc`}`
      : orderBy === "exempt_share"
      ? sql`case when count(*) = 0 then 0 else sum(case when violation_status = 'EXEMPT' then 1 else 0 end)::float / count(*) end ${direction === "asc" ? sql`asc` : sql`desc`}`
      : sql`count(*) ${direction === "asc" ? sql`asc` : sql`desc`}`;

  const rows = await sql`
    select
      coalesce(bus_route_id, 'UNKNOWN') as bus_route_id,
      count(*)::int as violations,
      sum(case when violation_status = 'EXEMPT' then 1 else 0 end)::int as exempt_count,
      min(first_occurrence) as first_seen,
      max(last_occurrence) as last_seen
    from violations
    ${whereClause ? sql`where ${whereClause}` : sql``}
    group by 1
    order by ${orderFragment}
    limit ${Math.max(1, Math.min(limit, 200))}
  `;

  return (rows as Array<{
    bus_route_id: string | null;
    violations: number;
    exempt_count: number;
    first_seen: string | null;
    last_seen: string | null;
  }>).map((row) => ({
    busRouteId: row.bus_route_id ?? "UNKNOWN",
    violations: row.violations ?? 0,
    exemptCount: row.exempt_count ?? 0,
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
  }));
}

export type HotspotRow = {
  busRouteId: string;
  stopName: string | null;
  latitude: number;
  longitude: number;
  violations: number;
  exemptCount: number;
};

export async function getHotspots({
  limit = 50,
  routeId,
  start,
  end,
}: ViolationSummaryParams & { limit?: number }): Promise<HotspotRow[]> {
  if (!isDbConfigured) {
    const sample: HotspotRow[] = [
      {
        busRouteId: "Bx12-SBS",
        stopName: "Fordham Rd & 3rd Ave",
        latitude: 40.86148,
        longitude: -73.89433,
        violations: 214,
        exemptCount: 36,
      },
      {
        busRouteId: "M15-SBS",
        stopName: "1st Ave & E 14 St",
        latitude: 40.73252,
        longitude: -73.98367,
        violations: 185,
        exemptCount: 27,
      },
      {
        busRouteId: "Q44-SBS",
        stopName: "Main St & Roosevelt Ave",
        latitude: 40.75968,
        longitude: -73.83053,
        violations: 168,
        exemptCount: 22,
      },
      {
        busRouteId: "S79-SBS",
        stopName: "Hylan Blvd & Richmond Ave",
        latitude: 40.56152,
        longitude: -74.14838,
        violations: 142,
        exemptCount: 31,
      },
      {
        busRouteId: "B44-SBS",
        stopName: "Nostrand Ave & Avenue H",
        latitude: 40.63144,
        longitude: -73.94718,
        violations: 133,
        exemptCount: 19,
      },
    ];
    const filtered = routeId ? sample.filter((row) => row.busRouteId === routeId) : sample;
    const clampedLimit = Math.max(1, Math.min(limit, filtered.length || sample.length));
    const source = filtered.length ? filtered : sample;
    return source.slice(0, clampedLimit);
  }

  const filters: any[] = [sql`violation_latitude is not null`, sql`violation_longitude is not null`];
  if (routeId) {
    filters.push(sql`bus_route_id = ${routeId}`);
  }
  const startIso = coerceIso(start);
  if (startIso) {
    filters.push(sql`last_occurrence >= ${startIso}`);
  }
  const endIso = coerceIso(end);
  if (endIso) {
    filters.push(sql`last_occurrence < ${endIso}`);
  }

  const whereClause = filters.slice(1).reduce((acc, clause) => sql`${acc} and ${clause}`, filters[0]);

  const rows = await sql`
    select
      coalesce(bus_route_id, 'UNKNOWN') as bus_route_id,
      stop_name,
      round(violation_latitude::numeric, 6)::float as latitude,
      round(violation_longitude::numeric, 6)::float as longitude,
      count(*)::int as violations,
      sum(case when violation_status = 'EXEMPT' then 1 else 0 end)::int as exempt_count
    from violations
    where ${whereClause}
    group by 1, 2, 3, 4
    having count(*) > 0
    order by violations desc
    limit ${Math.max(1, Math.min(limit, 200))}
  `;

  return (rows as Array<{
    bus_route_id: string | null;
    stop_name: string | null;
    latitude: number | null;
    longitude: number | null;
    violations: number;
    exempt_count: number;
  }>).map((row) => ({
    busRouteId: row.bus_route_id ?? "UNKNOWN",
    stopName: row.stop_name,
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    violations: row.violations ?? 0,
    exemptCount: row.exempt_count ?? 0,
  }));
}

export type ExemptRepeaterRow = {
  vehicleId: string;
  violations: number;
  routes: string[];
};

export async function getExemptRepeaters({
  limit = 20,
  routeId,
  start,
  end,
  minOccurrences = 5,
}: ViolationSummaryParams & { limit?: number; minOccurrences?: number }): Promise<ExemptRepeaterRow[]> {
  const filters: any[] = [sql`violation_status = 'EXEMPT'`, sql`vehicle_id is not null`];
  if (routeId) {
    filters.push(sql`bus_route_id = ${routeId}`);
  }
  const startIso = coerceIso(start);
  if (startIso) {
    filters.push(sql`last_occurrence >= ${startIso}`);
  }
  const endIso = coerceIso(end);
  if (endIso) {
    filters.push(sql`last_occurrence < ${endIso}`);
  }

  const whereClause = filters.slice(1).reduce((acc, clause) => sql`${acc} and ${clause}`, filters[0]);

  const rows = await sql`
    select
      vehicle_id,
      count(*)::int as violations,
      array_agg(distinct bus_route_id) as routes
    from violations
    where ${whereClause}
    group by vehicle_id
    having count(*) >= ${Math.max(1, minOccurrences)}
    order by violations desc
    limit ${Math.max(1, Math.min(limit, 200))}
  `;

  return (rows as Array<{
    vehicle_id: string | null;
    violations: number;
    routes: string[];
  }>).map((row) => ({
    vehicleId: row.vehicle_id ?? "UNKNOWN",
    violations: row.violations ?? 0,
    routes: row.routes?.filter(Boolean) ?? [],
  }));
}
