"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import Sparkline from "@/components/charts/Sparkline";
import { bearingDegrees, bearingToCardinal, formatDistance, haversineDistanceKm, type LatLng } from "@/lib/geo/location";
import { BRAND_PRIMARY_HEX } from "@/lib/ui/colors";

const percent = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("en-US");

const ROUTE_COLORS: Record<string, string> = {
  "M15-SBS": BRAND_PRIMARY_HEX,
  "Bx12-SBS": "#10b981",
  Q46: "#f97316",
  "B44-SBS": "#8b5cf6",
  "S79-SBS": "#0ea5e9",
  M103: "#ffcd32",
  BxM1: "#ef4444",
};

const CAMPUS_MARKER_COLOR = ROUTE_COLORS["B44-SBS"];

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
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const MapPanel = useMemo(
    () => dynamic(() => import("@/components/MapPanel"), { ssr: false }),
    []
  );

  const handleShareLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("This browser does not support location access.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation(position);
        setLocationError(null);
        setIsLocating(false);
      },
      (error) => {
        setLocationError(error?.message || "Unable to fetch your location.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

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

  // Compute overall data window from route metrics (for page context)
  const dataWindow = useMemo(() => {
    if (!routeMetrics.length) return null as null | { first: string; last: string };
    let first: string | null = null;
    let last: string | null = null;
    for (const row of routeMetrics) {
      if (row.firstSeen && (!first || row.firstSeen < first)) first = row.firstSeen;
      if (row.lastSeen && (!last || row.lastSeen > last)) last = row.lastSeen;
    }
    return first && last ? { first, last } : null;
  }, [routeMetrics]);

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
    ? filteredRoutes.reduce((acc, route) => acc + (route.speedChangePct ?? 0), 0) / filteredRoutes.length
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
          color: CAMPUS_MARKER_COLOR,
          title: campus.campus,
          description: `${campus.type ?? "Campus"} | ${campus.address ?? ""}${campus.city ? `, ${campus.city}` : ""}${campus.state ? `, ${campus.state}` : ""}`,
          href: campus.website ?? undefined,
        })),
    [campuses, selectedCampusType]
  );

  const userCoordinates = useMemo<LatLng | null>(() => {
    if (!userLocation) return null;
    return {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    };
  }, [userLocation]);

  const nearestHotspot = useMemo(() => {
    if (!userCoordinates || !filteredHotspots.length) return null;
    let closest = filteredHotspots[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const point of filteredHotspots) {
      const distanceKm = haversineDistanceKm(userCoordinates, {
        latitude: point.latitude,
        longitude: point.longitude,
      });
      if (distanceKm < closestDistance) {
        closest = point;
        closestDistance = distanceKm;
      }
    }

    const bearing = bearingDegrees(userCoordinates, {
      latitude: closest.latitude,
      longitude: closest.longitude,
    });

    return {
      point: closest,
      distanceKm: closestDistance,
      bearing,
    };
  }, [userCoordinates, filteredHotspots]);

  const nearestCampus = useMemo(() => {
    if (!userCoordinates || !campusMarkers.length) return null;
    let closest = campusMarkers[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const marker of campusMarkers) {
      const distanceKm = haversineDistanceKm(userCoordinates, {
        latitude: marker.latitude,
        longitude: marker.longitude,
      });
      if (distanceKm < closestDistance) {
        closest = marker;
        closestDistance = distanceKm;
      }
    }

    const bearing = bearingDegrees(userCoordinates, {
      latitude: closest.latitude,
      longitude: closest.longitude,
    });

    return {
      marker: closest,
      distanceKm: closestDistance,
      bearing,
    };
  }, [userCoordinates, campusMarkers]);

  const locationSummary = useMemo(() => {
    if (!userCoordinates) return null;
    if (!filteredHotspots.length && !campusMarkers.length) {
      return "Location captured. Map layers will update once hotspot or campus data is available.";
    }

    if (nearestHotspot) {
      const distanceCopy = formatDistance(nearestHotspot.distanceKm);
      const direction = bearingToCardinal(nearestHotspot.bearing);
      const stopLabel = nearestHotspot.point.stopName ?? "an unnamed stop";
      const exemptShare = nearestHotspot.point.violations
        ? (nearestHotspot.point.exemptCount / nearestHotspot.point.violations) * 100
        : null;
      const shareMessage =
        exemptShare !== null
          ? `Exempt share here is ${formatPercentValue(exemptShare)}.`
          : "";
      return [`You are ${distanceCopy} ${direction} of ${stopLabel} on ${nearestHotspot.point.busRouteId}.`, shareMessage]
        .filter(Boolean)
        .join(" ");
    }

    if (nearestCampus) {
      const distanceCopy = formatDistance(nearestCampus.distanceKm);
      const direction = bearingToCardinal(nearestCampus.bearing);
      return `You are ${distanceCopy} ${direction} of ${nearestCampus.marker.title}.`;
    }

    return null;
  }, [userCoordinates, filteredHotspots.length, campusMarkers.length, nearestHotspot, nearestCampus]);

  const accuracyMeters = useMemo(() => {
    if (!userLocation) return null;
    const accuracy = Math.round(userLocation.coords.accuracy ?? 0);
    return Number.isFinite(accuracy) && accuracy > 0 ? accuracy : null;
  }, [userLocation]);

  const markerData = useMemo(
    () => [
      ...filteredHotspots.map((point) => {
        const share = point.violations ? (point.exemptCount / point.violations) * 100 : 0;
        return {
          id: `${point.busRouteId}-${point.latitude}-${point.longitude}`,
          longitude: point.longitude,
          latitude: point.latitude,
          color: ROUTE_COLORS[point.busRouteId] || BRAND_PRIMARY_HEX,
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

  // Quick insight picks (route and hotspot highlights)
  const highestMonthlyRoute = useMemo(() => {
    if (!filteredRoutes.length) return null as any;
    const rows = filteredRoutes.map((route) => {
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
      return { routeId: route.routeId, routeName: route.routeName, averageMonthly, dynamicExemptShare };
    });
    return rows.sort((a, b) => b.averageMonthly - a.averageMonthly)[0] || null;
  }, [filteredRoutes, routeMetricsMap]);

  const highestExemptRoute = useMemo(() => {
    if (!filteredRoutes.length) return null as any;
    const rows = filteredRoutes.map((route) => {
      const metrics = routeMetricsMap.get(route.routeId);
      const dynamicExemptShare = metrics?.violations
        ? (metrics.exemptCount / metrics.violations) * 100
        : Number(route.exemptSharePct ?? 0);
      return { routeId: route.routeId, routeName: route.routeName, dynamicExemptShare };
    });
    return rows.sort((a, b) => b.dynamicExemptShare - a.dynamicExemptShare)[0] || null;
  }, [filteredRoutes, routeMetricsMap]);

  const fastestSpeedRoute = useMemo(() => {
    if (!filteredRoutes.length) return null as any;
    const rows = filteredRoutes
      .filter((r) => typeof r.speedChangePct === "number")
      .map((r) => ({ routeId: r.routeId, routeName: r.routeName, speed: Number(r.speedChangePct) }));
    return rows.sort((a, b) => b.speed - a.speed)[0] || null;
  }, [filteredRoutes]);

  // Micro-trend sparkline data for KPI cards
  const speedSpark = useMemo(() => {
    const rows = filteredRoutes
      .map((r) => ({ label: r.routeId, value: Math.max(0, Number(r.speedChangePct ?? 0)) }))
      .filter((p) => Number.isFinite(p.value));
    return rows.slice(0, 20);
  }, [filteredRoutes]);

  const exemptSpark = useMemo(() => {
    const rows = filteredRouteMetrics
      .map((row) => ({
        label: row.busRouteId,
        value: row.violations ? (row.exemptCount / row.violations) * 100 : 0,
      }))
      .filter((p) => Number.isFinite(p.value));
    return rows.slice(0, 20);
  }, [filteredRouteMetrics]);

  const hotspotSpark = useMemo(() => {
    const rows = topHotspots.map((h, i) => ({ label: String(i + 1), value: Number(h.violations || 0) }));
    return rows;
  }, [topHotspots]);

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
        <p className="text-sm text-foreground/70">Monitor hotspots, exemption pressure, and speed changes in one place.</p>
        {dataWindow && (
          <p className="text-xs text-foreground/60">
            Data window: {new Date(dataWindow.first).toLocaleDateString()} – {new Date(dataWindow.last).toLocaleDateString()}
          </p>
        )}
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
              Benchmark campus corridors, surface repeat exempt fleets, and prioritize field deployments.
            </p>
          </div>
          <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <li>Filter campus routes and compare ACE versus non-ACE speeds.</li>
            <li>Map hotspots for on-street teams and document DOT coordination needs.</li>
            <li>Use scenario playbooks for ready-to-run SQL and visualization prompts.</li>
            <li>Replace sample queries with the live Neon connection once the database is wired up.</li>
          </ul>
        </div>
      </section>

      {/* Quick insights summary */}
      <section className="animate-fade-up animate-fade-up-delay-2 rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft-lg sm:p-5">
        <h2 className="text-sm font-semibold">Quick insights</h2>
        <ul className="mt-2 space-y-1 text-sm text-foreground/80">
          {highestMonthlyRoute ? (
            <li>
              Monthly violations leader: <strong>{highestMonthlyRoute.routeId}</strong> · {integer.format(highestMonthlyRoute.averageMonthly)}
              {" "}| Exempt {formatPercentValue(highestMonthlyRoute.dynamicExemptShare)}
            </li>
          ) : (
            <li>No route metrics available for current filters.</li>
          )}
          {topHotspots[0] ? (
            <li>
              Highest-pressure stop: <strong>{topHotspots[0].stopName ?? "Unknown stop"}</strong> ({topHotspots[0].busRouteId}) · {integer.format(topHotspots[0].violations)} total
            </li>
          ) : null}
          {fastestSpeedRoute ? (
            <li>
              Largest speed gain: <strong>{fastestSpeedRoute.routeId}</strong> · {formatChange(fastestSpeedRoute.speed)}
            </li>
          ) : null}
        </ul>
      </section>
      {dataError && (
        <div className="animate-fade-up rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-xs text-destructive shadow-sm">
          {dataError}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 animate-fade-up animate-fade-up-delay-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <InsightCard
          title="Avg speed delta"
          value={formatChange(avgSpeedDelta)}
          subline="Across selected routes"
          trendLabel="Routes"
          trendDelta={`${filteredRoutes.length}`}
          trendPositive={avgSpeedDelta >= 0}
          footer={
            speedSpark.length ? (
              <Sparkline data={speedSpark} height={72} color="var(--chart-3)" valueFormatter={(v) => `${v.toFixed(1)}%`} />
            ) : null
          }
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
          footer={
            exemptSpark.length ? (
              <Sparkline data={exemptSpark} height={72} color="var(--chart-2)" valueFormatter={(v) => `${v.toFixed(1)}%`} />
            ) : null
          }
        />
        <InsightCard
          title="Hotspot load"
          value={integer.format(topHotspots.reduce((acc, point) => acc + point.violations, 0))}
          subline="Total violations across top hotspots"
          trendLabel="Hotspots"
          trendDelta={`${filteredHotspots.length}`}
          trendPositive={false}
          footer={
            hotspotSpark.length ? (
              <Sparkline data={hotspotSpark} height={72} color="var(--chart-6)" valueFormatter={(v) => integer.format(v)} />
            ) : null
          }
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
                      style={{ backgroundColor: ROUTE_COLORS[route.routeId] || BRAND_PRIMARY_HEX }}
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
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium">ACE hotspot map</h2>
                <p className="text-xs text-muted-foreground">
                  Share your location to see how close you are to key pressure points and campuses.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLocating ? "Locating…" : userLocation ? "Update my location" : "Share my location"}
                </button>
                {userLocation && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserLocation(null);
                      setLocationError(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-all hover:-translate-y-0.5 hover:border-foreground/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {locationError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive shadow-sm">
                {locationError}
              </div>
            )}
            {userLocation && locationSummary && (
              <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary/90 shadow-sm">
                <span>{locationSummary}</span>
                {accuracyMeters !== null && (
                  <span className="ml-1 text-primary/70">(±{accuracyMeters} m accuracy)</span>
                )}
              </div>
            )}
            <MapPanel
              height={280}
              center={[-73.95, 40.73]}
              zoom={10.2}
              markers={markerData}
              cluster={useClusters}
              hoverPopups={!useClusters}
              userLocation={
                userLocation
                  ? {
                      longitude: userLocation.coords.longitude,
                      latitude: userLocation.coords.latitude,
                      accuracy: userLocation.coords.accuracy,
                    }
                  : null
              }
            />
          </div>
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
                    {route.speedChangePct !== null ? formatChange(route.speedChangePct) : "—"}
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
