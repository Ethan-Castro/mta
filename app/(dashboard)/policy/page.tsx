"use client";
import dynamic from "next/dynamic";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { CUNY_CAMPUSES } from "@/lib/data/cuny";
import { useMemo, useState } from "react";

const typeColor: Record<string, string> = {
  "Community Colleges": "#22c55e",
  "Comprehensive Colleges": "#3b82f6",
  "Graduate Colleges": "#a855f7",
  "Honors Colleges": "#ef4444",
  "Senior Colleges": "#f59e0b",
};

export default function PolicyPage() {
  const [enabledTypes, setEnabledTypes] = useState<Record<string, boolean>>({
    "Community Colleges": true,
    "Comprehensive Colleges": true,
    "Graduate Colleges": true,
    "Honors Colleges": true,
    "Senior Colleges": true,
  });
  const [useClusters, setUseClusters] = useState(true);
  const [showExplain, setShowExplain] = useState(false);

  const markers = useMemo(() => CUNY_CAMPUSES
    .filter((c) => enabledTypes[c.type])
    .map((c) => ({
    id: c.campus,
    longitude: c.longitude,
    latitude: c.latitude,
    color: typeColor[c.type] || "#2563eb",
    title: `${c.campus} — ${c.type}`,
    description: `${c.address}, ${c.city}, ${c.state} ${c.zip}`,
    href: c.website,
    })), [enabledTypes]);
  const MapPanel = useMemo(
    () => dynamic(() => import("@/components/MapPanel"), { ssr: false }),
    []
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Policy View</h1>
        <p className="text-sm text-foreground/70">CUNY campuses across NYC.</p>
      </header>
      <div className="text-xs">
        <button onClick={() => setShowExplain((s) => !s)} className="rounded-md border border-foreground/10 hover:border-foreground/20 px-2 py-1 transition-colors">
          {showExplain ? "Hide explanation" : "Explain this view"}
        </button>
        {showExplain && (
          <div className="mt-2 rounded-md border border-foreground/10 p-3 text-foreground/80">
            This view maps CUNY campuses as a placeholder dataset. Use the type filters to show or hide campus categories and optionally enable clustering for dense areas.
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3 text-xs text-foreground/80">
          {Object.entries(typeColor).map(([k, v]) => (
            <label key={k} className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enabledTypes[k]}
                onChange={(e) => setEnabledTypes((prev) => ({ ...prev, [k]: e.target.checked }))}
              />
              <span className="inline-flex items-center gap-2">
                <span style={{ backgroundColor: v, width: 10, height: 10, borderRadius: 9999 }} />
                {k}
              </span>
            </label>
          ))}
        </div>
        <label className="text-xs inline-flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={useClusters} onChange={(e) => setUseClusters(e.target.checked)} />
          Enable clustering
        </label>
      </div>

      <MapPanel height={400} center={[-73.95, 40.73]} zoom={10.4} markers={markers} cluster={useClusters} hoverPopups={!useClusters} />
      <div className="rounded-lg border border-foreground/10 p-5 min-h-[220px]">Pre/Post trends (placeholder)</div>
      <div className="rounded-lg border border-foreground/10 p-5">
        <h2 className="text-sm font-medium mb-3">Sources</h2>
        <Sources>
          <SourcesTrigger count={3} />
          <SourcesContent>
            <Source href="https://data.ny.gov/Transportation/Automated-Bus-Lane-Enforcement-Violations/kh8p-hcbm" title="ACE Violations (NYC Open Data)" />
            <Source href="https://new.mta.info/transparency/board-and-committee-meetings" title="MTA Board Materials" />
            <Source href="https://www1.nyc.gov/site/finance/vehicles/bus-lane.page" title="NYC DOT Bus Lane Guidance" />
          </SourcesContent>
        </Sources>
      </div>
    </div>
  );
}


