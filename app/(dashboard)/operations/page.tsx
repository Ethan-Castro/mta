"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import InsightCard from "@/components/InsightCard";
import type { AnalystScenario, ExemptRepeater, RouteComparison } from "@/lib/data/insights";
import type { Campus } from "@/lib/data/cuny";
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
  const [routeComparisons, setRouteComparisons] = useState<RouteComparison[]>([]);
  const [analystScenarios, setAnalystScenarios] = useState<AnalystScenario[]>([]);
  const [curatedRepeaters, setCuratedRepeaters] = useState<ExemptRepeater[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [curatedError, setCuratedError] = useState<string | null>(null);
  const [campusError, setCampusError] = useState<string | null>(null);
  const [enabledRoutes, setEnabledRoutes] = useState<Record<string, boolean>>({});
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
    let cancelled = false;

    async function loadCurated() {
      try {
        const res = await fetch("/api/insights/curated?include=routes,repeaters,analystScenarios", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error || "Failed to load curated insights");
        const data = json?.data || {};
        if (!cancelled) {
          setRouteComparisons(Array.isArray(data.routes) ? (data.routes as RouteComparison[]) : []);
          setCuratedRepeaters(Array.isArray(data.repeaters) ? (data.repeaters as ExemptRepeater[]) : []);
          setAnalystScenarios(Array.isArray(data.analystScenarios) ? (data.analystScenarios as AnalystScenario[]) : []);
          setCuratedError(null);
        }
      } catch (error) {
        console.error("Unable to load operations curated data", error);
        if (!cancelled) {
          setRouteComparisons([]);
          setCuratedRepeaters([]);
          setAnalystScenarios([]);
          setCuratedError("Unable to load curated insights. Some context cards may be empty.");
        }
      }
    }

    loadCurated();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCampuses() {
      try {
        const res = await fetch("/api/cuny/campuses", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error || "Failed to load campuses");
        if (!cancelled) {
          setCampuses(Array.isArray(json?.campuses) ? (json.campuses as Campus[]) : []);
          setCampusError(null);
        }
      } catch (error) {
        console.error("Unable to load campus data", error);
        if (!cancelled) {
          setCampuses([]);
          setCampusError("Unable to load campus reference data.");
        }
      }
    }

    loadCampuses();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!routeComparisons.length) return;
    setEnabledRoutes((prev) => {
      if (Object.keys(prev).length) return prev;
      const next: Record<string, boolean> = {};
      routeComparisons.forEach((route) => {
        next[route.routeId] = true;
      });
      return next;
    });
  }, [routeComparisons]);

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

  const routeLookup = useMemo(() => new Map(routeComparisons.map((route) => [route.routeId, route])), [routeComparisons]);

  const campusTypeOptions = useMemo(() => {
    const unique = Array.from(new Set(routeComparisons.map((route) => route.campusType))).sort();
    return [
      { value: "all", label: "All campus types" },
      ...unique.map((type) => ({ value: type, label: type })),
    ];
  }, [routeComparisons]);

  const campusRouteIds = useMemo(() => {
    if (selectedCampusType === "all") {
      return new Set(routeComparisons.map((route) => route.routeId));
    }
    return new Set(
      routeComparisons.filter((route) => route.campusType === selectedCampusType).map((route) => route.routeId)
    );
  }, [routeComparisons, selectedCampusType]);

  const routeMetricsMap = useMemo(() => new Map(routeMetrics.map((row) => [row.busRouteId, row])), [routeMetrics]);

  const filteredRoutes = useMemo(
    () =>
      routeComparisons.filter(
        (route) => enabledRoutes[route.routeId] !== false && campusRouteIds.has(route.routeId)
      ),
    [routeComparisons, enabledRoutes, campusRouteIds]
  );

  const filteredRouteMetrics = useMemo(
    () =>
      routeMetrics.filter(
        (row) => enabledRoutes[row.busRouteId] !== false && campusRouteIds.has(row.busRouteId)
      ),
    [routeMetrics, enabledRoutes, campusRouteIds]
  );

  const filteredHotspots = useMemo(
    () =>
      hotspotMetrics
        .filter((row) => enabledRoutes[row.busRouteId] !== false && campusRouteIds.has(row.busRouteId))
        .map((row) => ({
          ...row,
          campus: routeLookup.get(row.busRouteId)?.campus ?? "Unknown campus",
        })),
    [hotspotMetrics, enabledRoutes, campusRouteIds, routeLookup]
  );

  const filteredRepeaters = useMemo(() => {
    const staticRepeaters = new Map(curatedRepeaters.map((row) => [row.vehicleId, row]));
    return repeaterMetrics
      .filter((row) => row.routes.some((routeId) => enabledRoutes[routeId] !== false && campusRouteIds.has(routeId)))
      .map((row) => ({
        ...row,
        staticContext: staticRepeaters.get(row.vehicleId),
      }));
  }, [repeaterMetrics, enabledRoutes, campusRouteIds, curatedRepeaters]);

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
      campuses
        .filter((campus) => {
          if (campus.latitude == null || campus.longitude == null) return false;
          if (selectedCampusType === "all") return true;
          return normalizeCampusType(campus.type ?? "") === selectedCampusType;
        })
        .map((campus) => ({
          id: `campus-${campus.campus.replace(/\s+/g, "-").toLowerCase()}`,
          longitude: Number(campus.longitude),
          latitude: Number(campus.latitude),
          color: "#8b5cf6",
          title: campus.campus,
          description: `${campus.type ?? "Campus"} | ${campus.address ?? ""}${campus.city ? `, ${campus.city}` : ""}${campus.state ? `, ${campus.state}` : ""}`,
          href: campus.website ?? undefined,
        })),
    [campuses, selectedCampusType]
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
        let averageMonthly = Number(route.averageMonthlyViolations ?? 0);
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
          : Number(route.exemptSharePct ?? 0);
        return {
          ...route,
          dynamicAverageMonthlyViolations: averageMonthly,
          dynamicExemptSharePct: dynamicExemptShare,
        };
      })
      .sort(
        (a, b) => Number(b.averageWeekdayStudents ?? 0) - Number(a.averageWeekdayStudents ?? 0)
      );
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
    <div className="space-y-4 sm:space-y-6">
      <header className="animate-fade-up space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Operations</h1>
        <p className="text-sm text-foreground/70">Compare routes, speeds, and violations.</p>
      </header>
      {(curatedError || campusError) && (
        <div className="animate-fade-up rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-xs text-destructive space-y-1 shadow-sm">
          {curatedError && <div>{curatedError}</div>}
          {campusError && <div>{campusError}</div>}
        </div>
      )}
      <section
        aria-labelledby="operations-brief"
        className="surface-card animate-fade-up animate-fade-up-delay-1 rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft-lg sm:p-5"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="operations-brief" className="text-sm font-semibold text-foreground">What this answers</h2>
            <p className="text-xs text-muted-foreground">
              Tackle Datathon Questions 1 and 2 by benchmarking campus corridors, exposing repeat exempt fleets, and staging
              field deployments.
            </p>
          </div>
          <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <li>• Filter campus routes and compare ACE vs non-ACE speeds.</li>
            <li>• Map hotspots for on-street teams and document DOT coordination needs.</li>
            <li>• Use scenario playbooks to script SQL + visualization steps for the copilot.</li>
            <li>• Swap Neon queries into tool cards once the database connection is live.</li>
          </ul>
        </div>
      </section>
      {dataError && (
        <div className="animate-fade-up rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-xs text-destructive shadow-sm">
          {dataError}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 animate-fade-up animate-fade-up-delay-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
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
      <section
        aria-labelledby="operations-comparison"
        className="surface-card animate-fade-up animate-fade-up-delay-3 rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft-lg space-y-3 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="operations-comparison" className="text-sm font-medium">Multi-route comparison</h2>
            <p className="text-xs text-muted-foreground">Live Neon counts for the busiest campus corridors under review.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Top routes</span>
            <Select value={String(comparisonLimit)} onValueChange={(value) => setComparisonLimit(Number(value))}>
              <SelectTrigger className="h-8 w-[72px] rounded-lg border border-foreground/15 bg-background/80 text-xs transition-colors duration-300 hover:border-primary/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30">
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
      <div className="animate-fade-up text-xs">
        <button
          onClick={() => setShowExplain((s) => !s)}
          className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-background/80 px-3 py-1.5 font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {showExplain ? "Hide explanation" : "Explain this view"}
        </button>
        {showExplain && (
          <div className="mt-2 rounded-md border border-foreground/10 bg-background/80 p-3 text-foreground/80 shadow-sm">
            Toggle individual routes to benchmark campus corridors. Cards refresh with Neon-powered metrics and the map
            highlights the highest-pressure locations for field teams.
          </div>
        )}
      </div>
      <div className="surface-card animate-fade-up rounded-xl border border-foreground/10 bg-card/80 p-4 shadow-soft-lg space-y-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Route focus</h2>
          <label className="text-xs inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useClusters}
              onChange={(e) => setUseClusters(e.target.checked)}
              className="h-4 w-4 rounded border-foreground/30 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            Cluster hotspots on map
          </label>
        </div>
        <div className="grid gap-3 text-xs text-foreground/80 md:grid-cols-[minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            <label htmlFor="operations-campus-filter" className="text-muted-foreground font-medium uppercase tracking-wide">
              Filter by campus type
            </label>
            <Select value={selectedCampusType} onValueChange={setSelectedCampusType}>
              <SelectTrigger
                id="operations-campus-filter"
                className="max-w-xs rounded-lg border border-foreground/15 bg-background/80 text-sm transition-colors duration-300 hover:border-primary/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30"
              >
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
            {routeComparisons.filter((route) => campusRouteIds.has(route.routeId)).map((route) => {
              const isEnabled = enabledRoutes[route.routeId] !== false;
              return (
                <label
                  key={route.routeId}
                  className="inline-flex items-center gap-2 cursor-pointer select-none rounded-full border border-foreground/10 bg-background/70 px-3 py-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) =>
                      setEnabledRoutes((prev) => ({
                        ...prev,
                        [route.routeId]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-foreground/30 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                  <span className="inline-flex items-center gap-2">
                    <span
                      style={{ backgroundColor: ROUTE_COLORS[route.routeId] || "#2563eb" }}
                      className="h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px_rgba(8,23,156,0.08)]"
                    />
                    {route.routeId} | {route.routeName}
                  </span>
                </label>
              );
            })}
            {campusRouteIds.size === 0 && (
              <span className="text-muted-foreground">No routes available for this campus filter.</span>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 animate-fade-up lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <MapPanel
            height={280}
            center={[-73.95, 40.73]}
            zoom={10.2}
            markers={markerData}
            cluster={useClusters}
            hoverPopups={!useClusters}
          />
          <div className="surface-card rounded-xl border border-foreground/10 bg-card/80 p-4 shadow-soft-lg space-y-3 sm:p-5">
            <h2 className="text-sm font-medium">Top pressure points</h2>
            {loadingData && !filteredHotspots.length ? (
              <div className="animate-pulse text-xs text-muted-foreground">Loading hotspot metrics…</div>
            ) : (
              <ul className="space-y-3 text-sm text-foreground/80">
                {topHotspots.map((point, index) => {
                  const share = point.violations ? (point.exemptCount / point.violations) * 100 : 0;
                  return (
                    <li
                      key={`${point.busRouteId}-${point.latitude}-${point.longitude}`}
                      className="rounded-lg border border-foreground/10 bg-background/80 p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-1 text-xs text-foreground/60 sm:flex-row sm:items-center sm:justify-between">
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
                  <li className="rounded-lg border border-dashed border-foreground/20 bg-background/70 p-3 text-xs text-muted-foreground">
                    No Neon hotspot data for the current filters.
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="surface-card rounded-xl border border-foreground/10 bg-card/80 p-4 shadow-soft-lg space-y-3 sm:p-5">
            <h2 className="text-sm font-medium">Repeat exempt vehicles</h2>
            <ul className="space-y-3 text-sm text-foreground/80">
              {filteredRepeaters.slice(0, 6).map((repeater) => {
                const staticContext = repeater.staticContext;
                return (
                  <li
                    key={repeater.vehicleId}
                    className="rounded-lg border border-foreground/10 bg-background/80 p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                  >
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
                <li className="rounded-lg border border-dashed border-foreground/20 bg-background/70 p-3 text-xs text-muted-foreground">
                  No repeat exempt fleets detected for the current filters.
                </li>
              )}
            </ul>
          </div>
          <div className="surface-card rounded-xl border border-foreground/10 bg-card/80 p-4 shadow-soft-lg space-y-3 sm:p-5">
            <h2 className="text-sm font-medium">Scenario playbooks</h2>
            <ul className="space-y-3 text-sm text-foreground/80">
              {analystScenarios.map((scenario) => (
                <li
                  key={scenario.title}
                  className="rounded-lg border border-foreground/10 bg-background/80 p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                >
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
      <section
        aria-labelledby="operations-table"
        className="surface-card animate-fade-up rounded-xl border border-foreground/10 bg-card/80 p-4 shadow-soft-lg sm:p-5"
      >
        <h2 className="mb-3 text-sm font-medium">Route comparison benchmark</h2>
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
                <tr key={route.routeId} className="align-top transition-colors hover:bg-primary/5">
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
