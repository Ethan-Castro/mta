"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import InsightCard from "@/components/InsightCard";
import { ANALYST_SCENARIOS, EXEMPT_REPEATERS, ROUTE_COMPARISONS } from "@/lib/data/insights";
import { CUNY_CAMPUSES } from "@/lib/data/cuny";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GroupedBar from "@/components/charts/GroupedBar";

const percent = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("en-US");

const ROUTE_COLORS: Record<string, string> = {
  "M15-SBS": "#2563eb",
  "Bx12-SBS": "#22c55e",
  Q46: "#f97316",
  "B44-SBS": "#a855f7",
  "S79-SBS": "#0ea5e9",
  M103: "#facc15",
  BxM1: "#ef4444",
};

type RouteMetricRow = {
  busRouteId: string;
  violations: number;
  exemptCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
};

type HotspotMetricRow = {
  busRouteId: string;
  stopName: string | null;
  latitude: number;
  longitude: number;
  violations: number;
  exemptCount: number;
};

type RepeaterMetricRow = {
  vehicleId: string;
  violations: number;
  routes: string[];
};

function formatPercentValue(value: number) {
  return `${percent.format(value)}%`;
}

function formatShareValue(value: number) {
  return `${percent.format(value * 100)}%`;
}

function formatChange(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${percent.format(value)}%`;
}

export default function OperationsPage() {
  function normalizeCampusType(type: string) {
    const t = type.toLowerCase();
    if (t.startsWith("senior")) return "Senior College";
    if (t.startsWith("comprehensive")) return "Comprehensive College";
    if (t.startsWith("community")) return "Community College";
    if (t.startsWith("graduate")) return "Graduate College";
    if (t.startsWith("honors")) return "Honors College";
    return type;
  }
  const [enabledRoutes, setEnabledRoutes] = useState<Record<string, boolean>>(() =>
    ROUTE_COMPARISONS.reduce<Record<string, boolean>>((acc, route) => {
      acc[route.routeId] = true;
      return acc;
    }, {})
  );
  const [useClusters, setUseClusters] = useState(true);
  const [showExplain, setShowExplain] = useState(false);
  const [selectedCampusType, setSelectedCampusType] = useState<string>("all");
  const [routeMetrics, setRouteMetrics] = useState<RouteMetricRow[]>([]);
  const [hotspotMetrics, setHotspotMetrics] = useState<HotspotMetricRow[]>([]);
  const [repeaterMetrics, setRepeaterMetrics] = useState<RepeaterMetricRow[]>([]);
  const [dataError, setDataError] = useState<string>("");
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [comparisonLimit, setComparisonLimit] = useState<number>(6);

  const MapPanel = useMemo(
    () => dynamic(() => import("@/components/MapPanel"), { ssr: false }),
    []
  );

  useEffect(() => {
    (async () => {
      try {
        setLoadingData(true);
        setDataError("");
        const [routesRes, hotspotsRes, repeatersRes] = await Promise.all([
          fetch("/api/violations/routes?limit=200", { cache: "no-store" }),
          fetch("/api/violations/hotspots?limit=200", { cache: "no-store" }),
          fetch("/api/violations/repeaters?limit=200", { cache: "no-store" }),
        ]);

        const [routesJson, hotspotsJson, repeatersJson] = await Promise.all([
          routesRes.json(),
          hotspotsRes.json(),
          repeatersRes.json(),
        ]);

        if (!routesJson.ok) throw new Error(routesJson.error || "Failed to load route metrics");
        if (!hotspotsJson.ok) throw new Error(hotspotsJson.error || "Failed to load hotspot metrics");
        if (!repeatersJson.ok) throw new Error(repeatersJson.error || "Failed to load repeaters");

        setRouteMetrics(routesJson.rows || []);
        setHotspotMetrics(hotspotsJson.rows || []);
        setRepeaterMetrics(repeatersJson.rows || []);
      } catch (error: any) {
        setDataError(error?.message || "Unable to load Neon analytics. Try refreshing.");
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  const routeLookup = useMemo(() => new Map(ROUTE_COMPARISONS.map((route) => [route.routeId, route])), []);

  const campusTypeOptions = useMemo(() => {
    const unique = Array.from(new Set(ROUTE_COMPARISONS.map((route) => route.campusType))).sort();
    return [
      { value: "all", label: "All campus types" },
      ...unique.map((type) => ({ value: type, label: type })),
    ];
  }, []);

  const campusRouteIds = useMemo(() => {
    if (selectedCampusType === "all") {
      return new Set(ROUTE_COMPARISONS.map((route) => route.routeId));
    }
    return new Set(
      ROUTE_COMPARISONS.filter((route) => route.campusType === selectedCampusType).map((route) => route.routeId)
    );
  }, [selectedCampusType]);

  const routeMetricsMap = useMemo(() => new Map(routeMetrics.map((row) => [row.busRouteId, row])), [routeMetrics]);

  const filteredRoutes = useMemo(
    () => ROUTE_COMPARISONS.filter((route) => enabledRoutes[route.routeId] && campusRouteIds.has(route.routeId)),
    [enabledRoutes, campusRouteIds]
  );

  const filteredRouteMetrics = useMemo(
    () => routeMetrics.filter((row) => enabledRoutes[row.busRouteId] && campusRouteIds.has(row.busRouteId)),
    [routeMetrics, enabledRoutes, campusRouteIds]
  );

  const filteredHotspots = useMemo(
    () =>
      hotspotMetrics
        .filter((row) => enabledRoutes[row.busRouteId] && campusRouteIds.has(row.busRouteId))
        .map((row) => ({
          ...row,
          campus: routeLookup.get(row.busRouteId)?.campus ?? "Unknown campus",
        })),
    [hotspotMetrics, enabledRoutes, campusRouteIds, routeLookup]
  );

  const filteredRepeaters = useMemo(() => {
    const staticRepeaters = new Map(EXEMPT_REPEATERS.map((row) => [row.vehicleId, row]));
    return repeaterMetrics
      .filter((row) => row.routes.some((routeId) => enabledRoutes[routeId] && campusRouteIds.has(routeId)))
      .map((row) => ({
        ...row,
        staticContext: staticRepeaters.get(row.vehicleId),
      }));
  }, [repeaterMetrics, enabledRoutes, campusRouteIds]);

  const aceShare = filteredRoutes.length
    ? filteredRoutes.filter((route) => route.aceEnforced).length / filteredRoutes.length
    : 0;
  const avgSpeedDelta = filteredRoutes.length
    ? filteredRoutes.reduce((acc, route) => acc + route.speedChangePct, 0) / filteredRoutes.length
    : 0;
  const avgExemptShare = filteredRouteMetrics.length
    ? filteredRouteMetrics.reduce((acc, row) => acc + (row.violations ? (row.exemptCount / row.violations) * 100 : 0), 0) /
      filteredRouteMetrics.length
    : 0;
  const totalStudents = filteredRoutes.reduce((acc, route) => acc + route.averageWeekdayStudents, 0);

  const campusMarkers = useMemo(
    () =>
      CUNY_CAMPUSES.filter((campus) => selectedCampusType === "all" || normalizeCampusType(campus.type) === selectedCampusType).map((campus) => ({
        id: `campus-${campus.campus.replace(/\s+/g, "-").toLowerCase()}`,
        longitude: campus.longitude,
        latitude: campus.latitude,
        color: "#8b5cf6",
        title: campus.campus,
        description: `${campus.type} | ${campus.address}, ${campus.city}, ${campus.state}`,
        href: campus.website,
      })),
    [selectedCampusType]
  );

  const markerData = useMemo(
    () => [
      ...filteredHotspots.map((point) => {
        const share = point.violations ? (point.exemptCount / point.violations) * 100 : 0;
        return {
          id: `${point.busRouteId}-${point.latitude}-${point.longitude}`,
          longitude: point.longitude,
          latitude: point.latitude,
          color: ROUTE_COLORS[point.busRouteId] || "#2563eb",
          title: `${point.stopName ?? "Unknown stop"} (${point.busRouteId})`,
          description: `${integer.format(point.violations)} violations | ${formatPercentValue(share)} exempt | ${point.campus}`,
        };
      }),
      ...campusMarkers,
    ],
    [filteredHotspots, campusMarkers]
  );

  const topHotspots = useMemo(
    () => filteredHotspots.slice().sort((a, b) => b.violations - a.violations).slice(0, 3),
    [filteredHotspots]
  );

  const routeTable = useMemo(() => {
    return filteredRoutes
      .map((route) => {
        const metrics = routeMetricsMap.get(route.routeId);
        let averageMonthly = route.averageMonthlyViolations;
        if (metrics?.violations && metrics.firstSeen && metrics.lastSeen) {
          const start = new Date(metrics.firstSeen);
          const end = new Date(metrics.lastSeen);
          if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            const months = Math.max(
              1,
              end.getFullYear() * 12 + end.getMonth() - (start.getFullYear() * 12 + start.getMonth()) + 1
            );
            averageMonthly = Math.round(metrics.violations / months);
          }
        }
        const dynamicExemptShare = metrics?.violations
          ? (metrics.exemptCount / metrics.violations) * 100
          : route.exemptSharePct;
        return {
          ...route,
          dynamicAverageMonthlyViolations: averageMonthly,
          dynamicExemptSharePct: dynamicExemptShare,
        };
      })
      .sort((a, b) => b.averageWeekdayStudents - a.averageWeekdayStudents);
  }, [filteredRoutes, routeMetricsMap]);

  const comparisonData = useMemo(() => {
    return filteredRouteMetrics
      .slice()
      .sort((a, b) => (b.violations ?? 0) - (a.violations ?? 0))
      .slice(0, comparisonLimit)
      .map((row) => ({
        name: row.busRouteId,
        violations: row.violations ?? 0,
        exempt: row.exemptCount ?? 0,
      }));
  }, [filteredRouteMetrics, comparisonLimit]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
        <p className="text-sm text-foreground/70">Compare routes, speeds, and violations.</p>
      </header>
      <section aria-labelledby="operations-brief" className="rounded-xl border border-border/60 bg-card/70 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="operations-brief" className="text-sm font-semibold text-foreground">What this answers</h2>
            <p className="text-xs text-muted-foreground">
              Tackle Datathon Questions 1 and 2 by benchmarking campus corridors, exposing repeat exempt fleets, and staging
              field deployments.
            </p>
          </div>
          <ul className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
            <li>• Filter campus routes and compare ACE vs non-ACE speeds.</li>
            <li>• Map hotspots for on-street teams and document DOT coordination needs.</li>
            <li>• Use scenario playbooks to script SQL + visualization steps for the copilot.</li>
            <li>• Swap Neon queries into tool cards once the database connection is live.</li>
          </ul>
        </div>
      </section>
      {dataError && (
        <div className="rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-xs text-destructive">
          {dataError}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <InsightCard
          title="Avg speed delta"
          value={formatChange(avgSpeedDelta)}
          subline="Across selected routes"
          trendLabel="Routes"
          trendDelta={`${filteredRoutes.length}`}
          trendPositive={avgSpeedDelta >= 0}
        />
        <InsightCard
          title="ACE coverage"
          value={formatShareValue(aceShare)}
          subline="Share of selected routes with cameras"
          trendLabel="Campus riders"
          trendDelta={integer.format(totalStudents)}
          trendPositive={aceShare >= 0.5}
        />
        <InsightCard
          title="Exempt share"
          value={formatPercentValue(avgExemptShare)}
          subline="Average exempt percentage (Neon)"
          trendLabel="Repeat fleets"
          trendDelta={`${filteredRepeaters.length}`}
          trendPositive={avgExemptShare < 15}
        />
        <InsightCard
          title="Hotspot load"
          value={integer.format(topHotspots.reduce((acc, point) => acc + point.violations, 0))}
          subline="Total violations across top hotspots"
          trendLabel="Hotspots"
          trendDelta={`${filteredHotspots.length}`}
          trendPositive={false}
        />
      </div>
      <section aria-labelledby="operations-comparison" className="rounded-xl border border-border/60 bg-card/70 p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="operations-comparison" className="text-sm font-medium">Multi-route comparison</h2>
            <p className="text-xs text-muted-foreground">Live Neon counts for the busiest campus corridors under review.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Top routes</span>
            <Select value={String(comparisonLimit)} onValueChange={(value) => setComparisonLimit(Number(value))}>
              <SelectTrigger className="h-8 w-[72px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {[4, 6, 8, 10].map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <GroupedBar data={comparisonData} height={260} />
        <p className="text-[11px] text-muted-foreground">
          Violations and exempt notifications are sourced directly from Neon Postgres. Adjust campus filters and toggles above to reshape this comparison.
        </p>
      </section>
      <div className="text-xs">
        <button onClick={() => setShowExplain((s) => !s)} className="rounded-md border border-foreground/10 hover:border-foreground/20 px-2 py-1 transition-colors">
          {showExplain ? "Hide explanation" : "Explain this view"}
        </button>
        {showExplain && (
          <div className="mt-2 rounded-md border border-foreground/10 p-3 text-foreground/80">
            Toggle individual routes to benchmark campus corridors. Cards refresh with Neon-powered metrics and the map
            highlights the highest-pressure locations for field teams.
          </div>
        )}
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Route focus</h2>
          <label className="text-xs inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={useClusters} onChange={(e) => setUseClusters(e.target.checked)} />
            Cluster hotspots on map
          </label>
        </div>
        <div className="grid gap-3 text-xs text-foreground/80 md:grid-cols-[minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            <label htmlFor="operations-campus-filter" className="text-muted-foreground font-medium uppercase tracking-wide">
              Filter by campus type
            </label>
            <Select value={selectedCampusType} onValueChange={setSelectedCampusType}>
              <SelectTrigger id="operations-campus-filter" className="max-w-xs text-sm">
                <SelectValue>
                  {campusTypeOptions.find((option) => option.value === selectedCampusType)?.label ?? "All campus types"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                {campusTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-3">
            {ROUTE_COMPARISONS.filter((route) => campusRouteIds.has(route.routeId)).map((route) => (
              <label key={route.routeId} className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!enabledRoutes[route.routeId]}
                  onChange={(e) =>
                    setEnabledRoutes((prev) => ({
                      ...prev,
                      [route.routeId]: e.target.checked,
                    }))
                  }
                />
                <span className="inline-flex items-center gap-2">
                  <span style={{ backgroundColor: ROUTE_COLORS[route.routeId] || "#2563eb", width: 10, height: 10, borderRadius: 9999 }} />
                  {route.routeId} | {route.routeName}
                </span>
              </label>
            ))}
            {campusRouteIds.size === 0 && (
              <span className="text-muted-foreground">No routes available for this campus filter.</span>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="space-y-4 xl:col-span-3">
          <MapPanel height={320} center={[-73.95, 40.73]} zoom={10.2} markers={markerData} cluster={useClusters} hoverPopups={!useClusters} />
          <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
            <h2 className="text-sm font-medium">Top pressure points</h2>
            {loadingData && !filteredHotspots.length ? (
              <div className="text-xs text-muted-foreground">Loading hotspot metrics…</div>
            ) : (
              <ul className="space-y-3 text-sm text-foreground/80">
                {topHotspots.map((point, index) => {
                  const share = point.violations ? (point.exemptCount / point.violations) * 100 : 0;
                  return (
                    <li key={`${point.busRouteId}-${point.latitude}-${point.longitude}`} className="rounded-lg border border-foreground/10 p-3">
                      <div className="flex items-center justify-between text-xs text-foreground/60">
                        <span>
                          #{index + 1} · {point.busRouteId} | {point.campus}
                        </span>
                        <span>
                          {integer.format(point.violations)} total | {formatPercentValue(share)} exempt
                        </span>
                      </div>
                      <div className="mt-1 font-medium text-foreground/90">{point.stopName ?? "Unknown stop"}</div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Recommend pairing ACE alerts with DOT curb checks when exempt share exceeds targets.
                      </p>
                    </li>
                  );
                })}
                {!topHotspots.length && (
                  <li className="rounded-lg border border-dashed border-foreground/20 p-3 text-xs text-muted-foreground">
                    No Neon hotspot data for the current filters.
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
            <h2 className="text-sm font-medium">Repeat exempt vehicles</h2>
            <ul className="space-y-3 text-sm text-foreground/80">
              {filteredRepeaters.slice(0, 6).map((repeater) => {
                const staticContext = repeater.staticContext;
                return (
                  <li key={repeater.vehicleId} className="rounded-lg border border-foreground/10 p-3">
                    <div className="flex items-center justify-between text-xs text-foreground/60">
                      <span>{repeater.vehicleId}</span>
                      <span>{repeater.violations} exemptions</span>
                    </div>
                    <div className="mt-1 text-xs text-foreground/60">Routes: {repeater.routes.join(", ") || "n/a"}</div>
                    <p className="mt-2 leading-relaxed text-xs text-muted-foreground">
                      {staticContext?.nextAction || "Flag for shared curb coordination and schedule targeted enforcement."}
                    </p>
                  </li>
                );
              })}
              {!filteredRepeaters.length && (
                <li className="rounded-lg border border-dashed border-foreground/20 p-3 text-xs text-muted-foreground">
                  No repeat exempt fleets detected for the current filters.
                </li>
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
            <h2 className="text-sm font-medium">Scenario playbooks</h2>
            <ul className="space-y-3 text-sm text-foreground/80">
              {ANALYST_SCENARIOS.map((scenario) => (
                <li key={scenario.title} className="rounded-lg border border-foreground/10 p-3">
                  <div className="font-medium text-foreground/90">{scenario.title}</div>
                  <div className="mt-1 text-xs text-foreground/60">Inputs: {scenario.expectedInputs}</div>
                  <p className="mt-2 leading-relaxed">{scenario.description}</p>
                  <p className="mt-2 text-xs text-foreground/60">Playbook: {scenario.playbook}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <section aria-labelledby="operations-table" className="rounded-xl border border-foreground/10 p-4">
        <h2 className="text-sm font-medium mb-3">Route comparison benchmark</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-foreground/60">
              <tr className="text-left">
                <th className="py-2 pr-3">Route</th>
                <th className="py-2 pr-3">Campus</th>
                <th className="py-2 pr-3">Students</th>
                <th className="py-2 pr-3">Speed change</th>
                <th className="py-2 pr-3">Violations/mo</th>
                <th className="py-2 pr-3">Exempt share</th>
                <th className="py-2">Narrative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {routeTable.map((route) => (
                <tr key={route.routeId} className="align-top">
                  <td className="py-2 pr-3 font-medium text-foreground/90">
                    {route.routeId}
                    <div className="text-xs text-foreground/60">{route.routeName}</div>
                  </td>
                  <td className="py-2 pr-3">
                    {route.campus}
                    <div className="text-xs text-foreground/60">{route.campusType}</div>
                  </td>
                  <td className="py-2 pr-3">
                    {integer.format(route.averageWeekdayStudents)}
                    <div className="text-xs text-foreground/60">{formatShareValue(route.studentShare)} of riders</div>
                  </td>
                  <td className="py-2 pr-3">
                    {formatChange(route.speedChangePct)}
                    <div className="text-xs text-foreground/60">{route.aceEnforced ? "ACE enforced" : "Needs ACE"}</div>
                  </td>
                  <td className="py-2 pr-3">{integer.format(route.dynamicAverageMonthlyViolations)}</td>
                  <td className="py-2 pr-3">{formatPercentValue(route.dynamicExemptSharePct)}</td>
                  <td className="py-2">{route.narrative}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
