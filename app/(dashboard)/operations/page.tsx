"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import InsightCard from "@/components/InsightCard";
import {
  ANALYST_SCENARIOS,
  EXEMPT_REPEATERS,
  ROUTE_COMPARISONS,
  VIOLATION_HOTSPOTS,
} from "@/lib/data/insights";
import { CUNY_CAMPUSES } from "@/lib/data/cuny";

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
  const [enabledRoutes, setEnabledRoutes] = useState<Record<string, boolean>>(() =>
    ROUTE_COMPARISONS.reduce<Record<string, boolean>>((acc, route) => {
      acc[route.routeId] = true;
      return acc;
    }, {})
  );
  const [useClusters, setUseClusters] = useState(true);
  const [showExplain, setShowExplain] = useState(false);

  const MapPanel = useMemo(
    () => dynamic(() => import("@/components/MapPanel"), { ssr: false }),
    []
  );

  const filteredRoutes = useMemo(
    () => ROUTE_COMPARISONS.filter((route) => enabledRoutes[route.routeId]),
    [enabledRoutes]
  );

  const hotspots = useMemo(
    () => VIOLATION_HOTSPOTS.filter((point) => enabledRoutes[point.routeId]),
    [enabledRoutes]
  );

  const repeaters = useMemo(
    () =>
      EXEMPT_REPEATERS.filter((repeater) => repeater.routes.some((route) => enabledRoutes[route]))
        .sort((a, b) => b.violations - a.violations),
    [enabledRoutes]
  );

  const aceShare = filteredRoutes.length
    ? filteredRoutes.filter((route) => route.aceEnforced).length / filteredRoutes.length
    : 0;
  const avgSpeedDelta = filteredRoutes.length
    ? filteredRoutes.reduce((acc, route) => acc + route.speedChangePct, 0) / filteredRoutes.length
    : 0;
  const avgExemptShare = filteredRoutes.length
    ? filteredRoutes.reduce((acc, route) => acc + route.exemptSharePct, 0) / filteredRoutes.length
    : 0;
  const totalStudents = filteredRoutes.reduce((acc, route) => acc + route.averageWeekdayStudents, 0);

  const campusMarkers = useMemo(
    () =>
      CUNY_CAMPUSES.map((campus) => ({
        id: `campus-${campus.campus.replace(/\s+/g, '-').toLowerCase()}`,
        longitude: campus.longitude,
        latitude: campus.latitude,
        color: "#8b5cf6", // Purple for campuses
        title: campus.campus,
        description: `${campus.type} | ${campus.address}, ${campus.city}, ${campus.state}`,
        href: campus.website,
      })),
    []
  );

  const markerData = useMemo(
    () => [
      ...hotspots.map((point) => ({
        id: point.id,
        longitude: point.longitude,
        latitude: point.latitude,
        color: ROUTE_COLORS[point.routeId] || "#2563eb",
        title: `${point.location} (${point.routeId})`,
        description: `${integer.format(point.averageDailyViolations)} violations/day | ${formatPercentValue(point.exemptSharePct)} exempt | ${point.campus}`,
      })),
      ...campusMarkers,
    ],
    [hotspots, campusMarkers]
  );

  const topHotspots = useMemo(
    () => [...hotspots].sort((a, b) => b.averageDailyViolations - a.averageDailyViolations).slice(0, 3),
    [hotspots]
  );

  const routeTable = useMemo(
    () => [...filteredRoutes].sort((a, b) => b.averageWeekdayStudents - a.averageWeekdayStudents),
    [filteredRoutes]
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
        <p className="text-sm text-foreground/70">Compare routes, speeds, and violations.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          subline="Average of monthly violation exemptions"
          trendLabel="Repeat fleets"
          trendDelta={`${repeaters.length}`}
          trendPositive={avgExemptShare < 15}
        />
        <InsightCard
          title="Hotspot load"
          value={integer.format(topHotspots.reduce((acc, point) => acc + point.averageDailyViolations, 0))}
          subline="Violations/day across top hotspots"
          trendLabel="Hotspots"
          trendDelta={`${hotspots.length}`}
          trendPositive={false}
        />
      </div>
      <div className="text-xs">
        <button onClick={() => setShowExplain((s) => !s)} className="rounded-md border border-foreground/10 hover:border-foreground/20 px-2 py-1 transition-colors">
          {showExplain ? "Hide explanation" : "Explain this view"}
        </button>
        {showExplain && (
          <div className="mt-2 rounded-md border border-foreground/10 p-3 text-foreground/80">
            Toggle individual routes to benchmark campus corridors. Cards refresh with real values drawn from the curated insight dataset and the map highlights the highest-pressure locations for field teams.
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
        <div className="flex flex-wrap gap-3 text-xs text-foreground/80">
          {ROUTE_COMPARISONS.map((route) => (
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
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 space-y-4">
          <MapPanel height={320} center={[-73.95, 40.73]} zoom={10.2} markers={markerData} cluster={useClusters} hoverPopups={!useClusters} />
          <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
            <h2 className="text-sm font-medium">Top pressure points</h2>
            <ul className="space-y-3 text-sm text-foreground/80">
              {topHotspots.map((point) => (
                <li key={point.id} className="rounded-lg border border-foreground/10 p-3">
                  <div className="flex items-center justify-between text-xs text-foreground/60">
                    <span>{point.routeId} | {point.campus}</span>
                    <span>{integer.format(point.averageDailyViolations)} /day | {formatPercentValue(point.exemptSharePct)} exempt</span>
                  </div>
                  <div className="mt-1 font-medium text-foreground/90">{point.location}</div>
                  <p className="mt-2 leading-relaxed">{point.highlight}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
            <h2 className="text-sm font-medium">Repeat exempt vehicles</h2>
            <ul className="space-y-3 text-sm text-foreground/80">
              {repeaters.map((repeater) => (
                <li key={repeater.vehicleId} className="rounded-lg border border-foreground/10 p-3">
                  <div className="flex items-center justify-between text-xs text-foreground/60">
                    <span>{repeater.vehicleId} | {repeater.company}</span>
                    <span>{repeater.violations} exemptions</span>
                  </div>
                  <div className="mt-1 text-xs text-foreground/60">Routes: {repeater.routes.join(", ")} | Hotspots: {repeater.hotspots.join(", ")}</div>
                  <p className="mt-2 leading-relaxed">{repeater.nextAction}</p>
                </li>
              ))}
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
      <div className="rounded-xl border border-foreground/10 p-4">
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
                  <td className="py-2 pr-3">{integer.format(route.averageMonthlyViolations)}</td>
                  <td className="py-2 pr-3">{formatPercentValue(route.exemptSharePct)}</td>
                  <td className="py-2">{route.narrative}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
