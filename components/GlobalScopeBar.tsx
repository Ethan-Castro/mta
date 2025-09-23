"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

type CampusOption = {
  value: string;
  label: string;
};

const CAMPUS_OPTIONS: CampusOption[] = [
  { value: "all", label: "All" },
  { value: "Senior College", label: "Senior college" },
  { value: "Community College", label: "Community college" },
  { value: "Other", label: "Other" },
];

export default function GlobalScopeBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const start = sp.get("start") ?? "";
  const end = sp.get("end") ?? "";
  const routeIdRaw = sp.get("routeId") ?? "";
  const campusType = sp.get("campusType") ?? "";

  const routeChips = useMemo(() => {
    // support comma-separated routes
    return routeIdRaw
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
  }, [routeIdRaw]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(sp.toString());
    if (value && value.length > 0) next.set(key, value);
    else next.delete(key);
    router.replace(`?${next.toString()}`);
  }

  function clearAll() {
    const next = new URLSearchParams(sp.toString());
    ["start", "end", "routeId", "campusType"].forEach((k) => next.delete(k));
    router.replace(`?${next.toString()}`);
  }

  function labelForCampus(value: string) {
    return CAMPUS_OPTIONS.find((o) => o.value === value)?.label || value;
  }

  return (
    <div className="sticky top-[48px] z-30 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <div className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-background/80 px-2 py-1">
            <span className="text-foreground/60">Start</span>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setParam("start", e.currentTarget.value)}
              className="bg-transparent text-foreground focus:outline-none"
              aria-label="Start datetime"
            />
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-background/80 px-2 py-1">
            <span className="text-foreground/60">End</span>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setParam("end", e.currentTarget.value)}
              className="bg-transparent text-foreground focus:outline-none"
              aria-label="End datetime"
            />
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-background/80 px-2 py-1">
            <span className="text-foreground/60">Route</span>
            <input
              value={routeIdRaw}
              placeholder="M15-SBS, Q46"
              onChange={(e) => setParam("routeId", e.currentTarget.value)}
              className="bg-transparent text-foreground focus:outline-none placeholder:text-foreground/40"
              aria-label="Route IDs"
            />
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-background/80 px-2 py-1">
            <span className="text-foreground/60">Campus</span>
            <select
              value={campusType}
              onChange={(e) => setParam("campusType", e.currentTarget.value)}
              className="bg-transparent text-foreground focus:outline-none"
              aria-label="Campus type"
            >
              <option value="">All</option>
              {CAMPUS_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {start && (
            <button
              onClick={() => setParam("start", null)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] text-primary transition-colors hover:border-primary/40 hover:bg-primary/15"
              aria-label="Remove start filter"
            >
              Start: {new Date(start).toLocaleString()}
              <X className="size-3" />
            </button>
          )}
          {end && (
            <button
              onClick={() => setParam("end", null)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] text-primary transition-colors hover:border-primary/40 hover:bg-primary/15"
              aria-label="Remove end filter"
            >
              End: {new Date(end).toLocaleString()}
              <X className="size-3" />
            </button>
          )}
          {routeChips.map((r) => (
            <button
              key={r}
              onClick={() => {
                const filtered = routeChips.filter((x) => x !== r);
                setParam("routeId", filtered.join(","));
              }}
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] text-primary transition-colors hover:border-primary/40 hover:bg-primary/15"
              aria-label={`Remove route ${r}`}
            >
              Route: {r}
              <X className="size-3" />
            </button>
          ))}
          {campusType && (
            <button
              onClick={() => setParam("campusType", null)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] text-primary transition-colors hover:border-primary/40 hover:bg-primary/15"
              aria-label="Remove campus type filter"
            >
              Campus: {labelForCampus(campusType)}
              <X className="size-3" />
            </button>
          )}
          {(start || end || routeChips.length || campusType) ? (
            <button
              onClick={clearAll}
              className="ml-1 inline-flex items-center rounded-full border border-foreground/15 bg-background/80 px-2 py-0.5 text-[11px] text-foreground/70 transition-colors hover:border-destructive/30 hover:text-destructive"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}


