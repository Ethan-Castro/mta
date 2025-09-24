"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import InsightCard from "@/components/InsightCard";
import type { RouteComparison, CbdRouteTrend, DocumentationLink } from "@/lib/data/insights";
import type { Campus } from "@/lib/data/cuny";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const percent = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("en-US");

function formatPercent(value: number) {
  return `${percent.format(value)}%`;
}

function formatChange(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${percent.format(value)}%`;
}

export default function PolicyPage() {
  const [showExplain, setShowExplain] = useState(false);
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const [selectedBorough, setSelectedBorough] = useState<string>("all");
  const [routeComparisons, setRouteComparisons] = useState<RouteComparison[]>([]);
  const [cbdRouteTrends, setCbdRouteTrends] = useState<CbdRouteTrend[]>([]);
  const [documents, setDocuments] = useState<DocumentationLink[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [curatedError, setCuratedError] = useState<string | null>(null);
  const [campusError, setCampusError] = useState<string | null>(null);

  const MapPanel = useMemo(
    () => dynamic(() => import("@/components/MapPanel"), { ssr: false }),
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCurated() {
      try {
        const res = await fetch("/api/insights/curated?include=routes,cbdRoutes,documents", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error || "Failed to load policy insights");
        const data = json?.data || {};
        if (!cancelled) {
          setRouteComparisons(Array.isArray(data.routes) ? (data.routes as RouteComparison[]) : []);
          setCbdRouteTrends(Array.isArray(data.cbdRoutes) ? (data.cbdRoutes as CbdRouteTrend[]) : []);
          setDocuments(Array.isArray(data.documents) ? (data.documents as DocumentationLink[]) : []);
          setCuratedError(null);
        }
      } catch (error) {
        console.error("Unable to load policy curated data", error);
        if (!cancelled) {
          setRouteComparisons([]);
          setCbdRouteTrends([]);
          setDocuments([]);
          setCuratedError("Unable to load curated policy insights. Some cards may be empty.");
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
        console.error("Unable to load campuses", error);
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

  const boroughOptions = useMemo(() => {
    const unique = Array.from(new Set(cbdRouteTrends.map((route) => route.boroughs))).sort();
    return [
      { value: "all", label: "All boroughs" },
      ...unique.map((borough) => ({ value: borough, label: borough })),
    ];
  }, [cbdRouteTrends]);

  const policyRoutes = useMemo(
    () =>
      cbdRouteTrends.filter((route) => {
        const include = showAllRoutes || route.crossesCbd;
        const matchesBorough = selectedBorough === "all" || route.boroughs.toLowerCase().includes(selectedBorough.toLowerCase());
        return include && matchesBorough;
      }),
    [cbdRouteTrends, showAllRoutes, selectedBorough]
  );

  const avgViolationChange = policyRoutes.length
    ? policyRoutes.reduce((acc, route) => acc + Number(route.violationChangePct ?? 0), 0) / policyRoutes.length
    : 0;
  const avgSpeedDelta = policyRoutes.length
    ? policyRoutes.reduce((acc, route) => acc + Number(route.speedChangePct ?? 0), 0) / policyRoutes.length
    : 0;
  const routesNeedingAce = routeComparisons.filter((route) => !route.aceEnforced);
  const cbdRoutes = policyRoutes.filter((route) => route.crossesCbd);
  const campusMarkers = useMemo(
    () =>
      campuses
        .filter((campus) => {
          if (campus.latitude == null || campus.longitude == null) return false;
          if (selectedBorough === "all") return true;
          const boroughLower = selectedBorough.toLowerCase();
          const boroughToCity: Record<string, string[]> = {
            manhattan: ["new york"],
            bronx: ["bronx"],
            brooklyn: ["brooklyn"],
            queens: ["flushing", "long island city", "bayside", "jamaica"],
            "bronx/manhattan": ["bronx", "new york"],
            staten: ["staten island"],
            "staten island": ["staten island"],
          };
          const cities = boroughToCity[boroughLower] || [boroughLower];
          const city = (campus.city || "").toLowerCase();
          const cityMatch = cities.some((c) => city.includes(c));
          const nameMatch = campus.campus.toLowerCase().includes(boroughLower);
          return cityMatch || nameMatch;
        })
        .map((campus) => ({
          id: `campus-${campus.campus.replace(/\s+/g, '-').toLowerCase()}`,
          longitude: Number(campus.longitude),
          latitude: Number(campus.latitude),
          color: "#8b5cf6", // Purple for campuses
          title: campus.campus,
          description: `${campus.type ?? "Campus"} | ${campus.address ?? ""}${campus.city ? `, ${campus.city}` : ""}${campus.state ? `, ${campus.state}` : ""}`,
          href: campus.website ?? undefined,
        })),
    [campuses, selectedBorough]
  );

  const markers = useMemo(
    () => [
      ...policyRoutes
        .filter((route) => route.longitude != null && route.latitude != null)
        .map((route) => ({
          id: route.routeId,
          longitude: Number(route.longitude),
          latitude: Number(route.latitude),
          color: route.crossesCbd ? "#2563eb" : "#f97316",
          title: `${route.routeId} | ${route.routeName}`,
          description: `${formatChange(Number(route.speedChangePct ?? 0))} speed | ${formatChange(Number(route.violationChangePct ?? 0))} violations | ${route.boroughs}`,
        })),
      ...campusMarkers,
    ],
    [policyRoutes, campusMarkers]
  );

  const topOpportunities = useMemo(
    () =>
      [...cbdRouteTrends]
        .sort((a, b) => Number(a.violationChangePct ?? 0) - Number(b.violationChangePct ?? 0))
        .slice(0, 3),
    [cbdRouteTrends]
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Policy View</h1>
        <p className="text-sm text-foreground/70">Quantify ACE and congestion pricing impact.</p>
      </header>
      {(curatedError || campusError) && (
        <div className="rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-xs text-destructive space-y-1">
          {curatedError && <div>{curatedError}</div>}
          {campusError && <div>{campusError}</div>}
        </div>
      )}
      <section aria-labelledby="policy-brief" className="rounded-xl border border-border/60 bg-card/70 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h2 id="policy-brief" className="text-sm font-semibold text-foreground">Connect to Question 3</h2>
            <p className="text-xs text-muted-foreground">
              Compare ACE corridors that cross the CBD against congestion pricing milestones and assemble policy-ready narratives.
            </p>
            <ul className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
              <li>• Track violation deltas and speed gains since tolling went live.</li>
              <li>• Surface which campuses benefit most from faster CBD lanes.</li>
              <li>• Attach documentation so every insight is citation-ready.</li>
              <li>• Flag non-CBD comparators to justify ACE expansion priorities.</li>
            </ul>
          </div>
          <div className="flex min-w-[210px] flex-col gap-2 text-xs text-muted-foreground">
            <label htmlFor="policy-borough-filter" className="font-medium uppercase tracking-wide">
              Filter by borough
            </label>
            <Select value={selectedBorough} onValueChange={setSelectedBorough}>
              <SelectTrigger id="policy-borough-filter" className="text-sm">
                <SelectValue>
                  {boroughOptions.find((option) => option.value === selectedBorough)?.label ?? "All boroughs"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {boroughOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InsightCard
          title="Violation change"
          value={formatPercent(Math.abs(avgViolationChange))}
          subline={avgViolationChange < 0 ? "Drop since congestion pricing" : "Increase since congestion pricing"}
          trendLabel="Routes in view"
          trendDelta={`${policyRoutes.length}`}
          trendPositive={avgViolationChange < 0}
        />
        <InsightCard
          title="Speed change"
          value={formatPercent(Math.abs(avgSpeedDelta))}
          subline={avgSpeedDelta >= 0 ? "ACE + pricing improved travel" : "Speeds declined"}
          trendLabel="CBD corridors"
          trendDelta={`${cbdRoutes.length}`}
          trendPositive={avgSpeedDelta >= 0}
        />
        <InsightCard
          title="Needs ACE"
          value={`${routesNeedingAce.length}`}
          subline="High student routes lacking cameras"
          trendLabel="Priority example"
          trendDelta={routesNeedingAce.length ? routesNeedingAce[0].routeId : "—"}
          trendPositive={false}
        />
        <InsightCard
          title="Docs tracked"
          value={`${documents.length}`}
          subline="Linked regulations & datasets"
          trendLabel="Toggle non-CBD"
          trendDelta={showAllRoutes ? "On" : "Off"}
          trendPositive={showAllRoutes}
        />
      </div>
      <div className="text-xs">
        <button onClick={() => setShowExplain((s) => !s)} className="rounded-md border border-foreground/10 hover:border-foreground/20 px-2 py-1 transition-colors">
          {showExplain ? "Hide explanation" : "Explain this view"}
        </button>
        {showExplain && (
          <div className="mt-2 rounded-md border border-foreground/10 p-3 text-foreground/80">
            Track congestion pricing impacts by default, then layer in non-CBD comparison routes to size the next ACE deployment wave.
          </div>
        )}
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Route scope</h2>
          <label className="text-xs inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={showAllRoutes} onChange={(e) => setShowAllRoutes(e.target.checked)} />
            Include non-CBD comparators
          </label>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-foreground/80">
          {policyRoutes.map((route) => (
            <span key={route.routeId} className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-3 py-1">
              <span style={{ backgroundColor: route.crossesCbd ? "#2563eb" : "#f97316", width: 10, height: 10, borderRadius: 9999 }} />
              {route.routeId} | {route.routeName}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MapPanel height={360} center={[-73.98, 40.75]} zoom={11.2} markers={markers} cluster={false} hoverPopups />
        <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
          <h2 className="text-sm font-medium">Policy takeaways</h2>
          <ul className="space-y-3 text-sm text-foreground/80">
            {topOpportunities.map((route) => (
              <li key={route.routeId} className="rounded-lg border border-foreground/10 p-3">
                <div className="flex items-center justify-between text-xs text-foreground/60">
                  <span>{route.routeId} | {route.boroughs}</span>
                  <span>{route.violationChangePct !== null ? formatChange(route.violationChangePct) : "—"} violations | {route.speedChangePct !== null ? formatChange(route.speedChangePct) : "—"} speed</span>
                </div>
                <div className="mt-1 font-medium text-foreground/90">{route.routeName}</div>
                <p className="mt-2 leading-relaxed">{route.highlight}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-4">
        <h2 className="text-sm font-medium">Pre/post comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-foreground/60">
              <tr className="text-left">
                <th className="py-2 pr-3">Route</th>
                <th className="py-2 pr-3">Pre-pricing violations</th>
                <th className="py-2 pr-3">Post-pricing violations</th>
                <th className="py-2 pr-3">Change</th>
                <th className="py-2 pr-3">Speed change</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {policyRoutes.map((route) => (
                <tr key={route.routeId} className="align-top">
                  <td className="py-2 pr-3 font-medium text-foreground/90">
                    {route.routeId}
                    <div className="text-xs text-foreground/60">{route.routeName}</div>
                  </td>
                  <td className="py-2 pr-3">{route.prePricingViolations !== null ? integer.format(route.prePricingViolations) : "—"}</td>
                  <td className="py-2 pr-3">{route.postPricingViolations !== null ? integer.format(route.postPricingViolations) : "—"}</td>
                  <td className="py-2 pr-3">{route.violationChangePct !== null ? formatChange(route.violationChangePct) : "—"}</td>
                  <td className="py-2 pr-3">{route.speedChangePct !== null ? formatChange(route.speedChangePct) : "—"}</td>
                  <td className="py-2">{route.highlight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Documentation to cite</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {documents.map((doc) => (
            <a key={doc.href} href={doc.href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-foreground/10 px-3 py-2 hover:border-foreground/30 transition-colors">
              <div className="font-medium text-foreground/90">{doc.title}</div>
              <p className="mt-1 text-xs text-foreground/60 leading-relaxed">{doc.summary}</p>
            </a>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4">
        <h2 className="text-sm font-medium mb-3">Sources</h2>
        <Sources>
          <SourcesTrigger count={documents.length} />
          <SourcesContent>
            {documents.map((doc) => (
              <Source key={doc.href} href={doc.href} title={doc.title} />
            ))}
          </SourcesContent>
        </Sources>
      </div>
    </div>
  );
}
