"use client";
import dynamic from "next/dynamic";
import { CUNY_CAMPUSES } from "@/lib/data/cuny";
import { useMemo, useState } from "react";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";

const typeColor: Record<string, string> = {
  "Community Colleges": "#22c55e",
  "Comprehensive Colleges": "#3b82f6",
  "Graduate Colleges": "#a855f7",
  "Honors Colleges": "#ef4444",
  "Senior Colleges": "#f59e0b",
};

export default function OperationsPage() {
  const [enabledTypes, setEnabledTypes] = useState<Record<string, boolean>>({
    "Community Colleges": true,
    "Comprehensive Colleges": true,
    "Graduate Colleges": true,
    "Honors Colleges": true,
    "Senior Colleges": true,
  });
  const [useClusters, setUseClusters] = useState(true);
  const [showExplain, setShowExplain] = useState(false);

  const markers = useMemo(
    () =>
      CUNY_CAMPUSES.filter((c) => enabledTypes[c.type]).map((c) => ({
        id: c.campus,
        longitude: c.longitude,
        latitude: c.latitude,
        color: typeColor[c.type] || "#2563eb",
        title: `${c.campus} — ${c.type}`,
        description: `${c.address}, ${c.city}, ${c.state} ${c.zip}`,
        href: c.website,
      })),
    [enabledTypes]
  );

  const MapPanel = useMemo(
    () => dynamic(() => import("@/components/MapPanel"), { ssr: false }),
    []
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
        <p className="text-sm text-foreground/70">Compare routes, speeds, and violations.</p>
      </header>
      <div className="text-xs">
        <button onClick={() => setShowExplain((s) => !s)} className="rounded-md border border-foreground/10 hover:border-foreground/20 px-2 py-1 transition-colors">
          {showExplain ? "Hide explanation" : "Explain this view"}
        </button>
        {showExplain && (
          <div className="mt-2 rounded-md border border-foreground/10 p-3 text-foreground/80">
            The operations map temporarily mirrors the policy map to provide a consistent spatial context. Use the filters to focus on campus categories and toggle clustering for dense points.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Tool defaultOpen className="bg-background/70">
          <ToolHeader type="tool-getViolationsSummary" state="input-available" />
          <ToolContent>
            <ToolInput input={{ dataset: "ACE violations", params: { cluster: useClusters, types: Object.keys(enabledTypes).filter((k) => enabledTypes[k]) } }} />
            <ToolOutput output={[{ note: "Sample output omitted in demo" }]} errorText={undefined} />
          </ToolContent>
        </Tool>
        <MapPanel height={260} center={[-73.95, 40.73]} zoom={10.4} markers={markers} cluster={useClusters} hoverPopups={!useClusters} />
      </div>
    </div>
  );
}


