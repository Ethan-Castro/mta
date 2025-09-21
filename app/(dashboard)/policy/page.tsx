"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import InsightCard from "@/components/InsightCard";
import {
  CBD_ROUTE_TRENDS,
  DOCUMENTATION_LINKS,
  ROUTE_COMPARISONS,
} from "@/lib/data/insights";
import { CUNY_CAMPUSES } from "@/lib/data/cuny";
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

  const MapPanel = useMemo(
    () => dynamic(() => import("@/components/MapPanel"), { ssr: false }),
    []
  );

  const boroughOptions = useMemo(() => {
    const unique = Array.from(new Set(CBD_ROUTE_TRENDS.map((route) => route.boroughs))).sort();
    return [
      { value: "all", label: "All boroughs" },
      ...unique.map((borough) => ({ value: borough, label: borough })),
    ];
  }, []);

  const policyRoutes = useMemo(
    () =>
      CBD_ROUTE_TRENDS.filter((route) => {
        const include = showAllRoutes || route.crossesCbd;
        const matchesBorough = selectedBorough === "all" || route.boroughs.toLowerCase().includes(selectedBorough.toLowerCase());
        return include && matchesBorough;
      }),
    [showAllRoutes, selectedBorough]
  );

  const avgViolationChange = policyRoutes.length
    ? policyRoutes.reduce((acc, route) => acc + route.violationChangePct, 0) / policyRoutes.length
    : 0;
  const avgSpeedDelta = policyRoutes.length
    ? policyRoutes.reduce((acc, route) => acc + route.speedChangePct, 0) / policyRoutes.length
    : 0;
  const routesNeedingAce = ROUTE_COMPARISONS.filter((route) => !route.aceEnforced);
  const cbdRoutes = policyRoutes.filter((route) => route.crossesCbd);
  const campusMarkers = useMemo(
    () =>
      CUNY_CAMPUSES.filter((campus) => {
        if (selectedBorough === "all") return true;
        const boroughLower = selectedBorough.toLowerCase();
        // Map borough label to campus.city values used in dataset
        // Manhattan campuses are recorded as "New York"
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
        const cityMatch = cities.some((c) => campus.city.toLowerCase().includes(c));
        const nameMatch = campus.campus.toLowerCase().includes(boroughLower);
        return cityMatch || nameMatch;
      }).map((campus) => ({
        id: `campus-${campus.campus.replace(/\s+/g, '-').toLowerCase()}`,
        longitude: campus.longitude,
        latitude: campus.latitude,
        color: "#8b5cf6", // Purple for campuses
        title: campus.campus,
        description: `${campus.type} | ${campus.address}, ${campus.city}, ${campus.state}`,
        href: campus.website,
      })),
    [selectedBorough]
  );

  const markers = useMemo(
    () => [
      ...policyRoutes.map((route) => ({
        id: route.routeId,
        longitude: route.longitude,
        latitude: route.latitude,
        color: route.crossesCbd ? "#2563eb" : "#f97316",
        title: `${route.routeId} | ${route.routeName}`,
        description: `${formatChange(route.speedChangePct)} speed | ${formatChange(route.violationChangePct)} violations | ${route.boroughs}`,
      })),
      ...campusMarkers,
    ],
    [policyRoutes, campusMarkers]
  );

  const topOpportunities = useMemo(
    () => [...CBD_ROUTE_TRENDS].sort((a, b) => a.violationChangePct - b.violationChangePct).slice(0, 3),
    []
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Policy View</h1>
        <p className="text-sm text-foreground/70">Quantify ACE and congestion pricing impact.</p>
      </header>
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
          value={`${DOCUMENTATION_LINKS.length}`}
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
                  <span>{formatChange(route.violationChangePct)} violations | {formatChange(route.speedChangePct)} speed</span>
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
                  <td className="py-2 pr-3">{integer.format(route.prePricingViolations)}</td>
                  <td className="py-2 pr-3">{integer.format(route.postPricingViolations)}</td>
                  <td className="py-2 pr-3">{formatChange(route.violationChangePct)}</td>
                  <td className="py-2 pr-3">{formatChange(route.speedChangePct)}</td>
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
          {DOCUMENTATION_LINKS.map((doc) => (
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
          <SourcesTrigger count={DOCUMENTATION_LINKS.length} />
          <SourcesContent>
            {DOCUMENTATION_LINKS.map((doc) => (
              <Source key={doc.href} href={doc.href} title={doc.title} />
            ))}
          </SourcesContent>
        </Sources>
      </div>
    </div>
  );
}
