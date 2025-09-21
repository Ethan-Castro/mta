"use client";

import { useEffect, useMemo, useState } from "react";

type RouteRow = {
  busRouteId: string;
  violations: number;
  exemptCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
};

export default function ExecutiveKpis() {
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/violations/routes?limit=200", { cache: "no-store" });
        const json = await response.json();
        if (!json.ok) throw new Error(json.error || "Failed to load");
        setRoutes((json.rows || []) as RouteRow[]);
      } catch (e: any) {
        setError(e?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { totalViolations, totalExempt, routeCount, firstSeen, lastSeen } = useMemo(() => {
    const initial = {
      totalViolations: 0,
      totalExempt: 0,
      routeCount: routes.length,
      firstSeen: null as string | null,
      lastSeen: null as string | null,
    };

    return routes.reduce((acc, row) => {
      acc.totalViolations += row.violations ?? 0;
      acc.totalExempt += row.exemptCount ?? 0;
      if (row.firstSeen && (!acc.firstSeen || row.firstSeen < acc.firstSeen)) {
        acc.firstSeen = row.firstSeen;
      }
      if (row.lastSeen && (!acc.lastSeen || row.lastSeen > acc.lastSeen)) {
        acc.lastSeen = row.lastSeen;
      }
      return acc;
    }, initial);
  }, [routes]);

  const exemptShare = totalViolations ? Math.round((totalExempt / totalViolations) * 1000) / 10 : 0;
  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "n/a";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-foreground/10 p-5">
        <div className="text-xs text-foreground/60">ACE violations (Neon)</div>
        <div className="text-2xl font-medium mt-1">{loading ? "—" : totalViolations.toLocaleString()}</div>
        <div className="text-[11px] text-muted-foreground mt-1">Window: {formatDate(firstSeen)} → {formatDate(lastSeen)}</div>
      </div>
      <div className="rounded-lg border border-foreground/10 p-5">
        <div className="text-xs text-foreground/60">Exempt share</div>
        <div className="text-2xl font-medium mt-1">{loading ? "—" : `${exemptShare}%`}</div>
        <div className="text-[11px] text-muted-foreground mt-1">Exempt notices: {loading ? "—" : totalExempt.toLocaleString()}</div>
      </div>
      <div className="rounded-lg border border-foreground/10 p-5">
        <div className="text-xs text-foreground/60">Routes observed</div>
        <div className="text-2xl font-medium mt-1">{loading ? "—" : routeCount}</div>
        <div className="text-[11px] text-muted-foreground mt-1">Source: Neon Postgres (violations table)</div>
      </div>
      {error && <div className="md:col-span-3 text-xs text-red-500">Couldn&apos;t load KPIs. Refresh or try later.</div>}
    </div>
  );
}
