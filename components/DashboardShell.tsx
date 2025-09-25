"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRightIcon, MapPinIcon } from "lucide-react";

type DashboardRoute = "/executive" | "/operations" | "/map" | "/students" | "/policy" | "/data-science";

const NAV_ITEMS: Array<{ href: DashboardRoute; label: string }> = [
  { href: "/executive", label: "Executive" },
  { href: "/operations", label: "Operations" },
  { href: "/map", label: "Map Explorer" },
  { href: "/students", label: "CUNY Students" },
  { href: "/policy", label: "Policy" },
  { href: "/data-science", label: "Data Science" },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [metrics, setMetrics] = useState({
    totalRoutes: 0,
    aceRoutes: 0,
    coverage: 0,
    totalStudents: 0,
    repeaters: 0,
    meanSpeedGain: 0,
  });
  const [metricsLoaded, setMetricsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMetrics() {
      try {
        const res = await fetch("/api/insights/curated?include=routes,repeaters", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error || "Failed to load insight metrics");
        const routes = Array.isArray(json?.data?.routes) ? json.data.routes : [];
        const repeaters = Array.isArray(json?.data?.repeaters) ? json.data.repeaters : [];

        const totalRoutes = routes.length;
        const aceRoutes = routes.filter((route: any) => route?.aceEnforced).length;
        const coverage = totalRoutes ? Math.round((aceRoutes / totalRoutes) * 100) : 0;
        const totalStudents = routes.reduce(
          (acc: number, route: any) => acc + Number(route?.averageWeekdayStudents ?? 0),
          0
        );
        const aceSpeedSum = routes
          .filter((route: any) => route?.aceEnforced)
          .reduce((acc: number, route: any) => acc + Number(route?.speedChangePct ?? 0), 0);
        const meanSpeedGain = aceRoutes ? aceSpeedSum / aceRoutes : 0;

        if (!cancelled) {
          setMetrics({
            totalRoutes,
            aceRoutes,
            coverage,
            totalStudents,
            repeaters: repeaters.length,
            meanSpeedGain,
          });
          setMetricsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load dashboard metrics", error);
        if (!cancelled) {
          setMetricsLoaded(true);
        }
      }
    }

    loadMetrics();
    return () => {
      cancelled = true;
    };
  }, []);

  const metricsDisplay = useMemo(() => ({
    totalRoutes: metricsLoaded ? metrics.totalRoutes : null,
    coverage: metricsLoaded ? metrics.coverage : null,
    totalStudents: metricsLoaded ? metrics.totalStudents : null,
    meanSpeedGain: metricsLoaded ? metrics.meanSpeedGain : null,
    repeaters: metricsLoaded ? metrics.repeaters : null,
    aceRoutes: metricsLoaded ? metrics.aceRoutes : null,
  }), [metrics, metricsLoaded]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 sm:pb-12">
      {/* Data Disclaimer Banner */}
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-800 sm:mb-6">
        <strong>⚠️ Data in Progress:</strong> Data is not accurate yet. This is a development environment with sample data.
      </div>
      
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-10">
        <aside className="lg:w-64 xl:w-72">
        <div className="sticky top-24 space-y-4 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:top-28 lg:space-y-6 lg:p-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60">Navigator</p>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPinIcon className="size-4" aria-hidden="true" />
              ACE Decision Workspace
            </h2>
            <p className="text-xs text-muted-foreground">
              Slice routes, map hotspots, and brief leadership with curated AI workstreams.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-1 sm:gap-3">
            <div className="rounded-lg border border-border/60 bg-background/60 p-2.5 sm:p-3">
              <dt className="text-foreground/60">Routes tracked</dt>
              <dd className="text-base font-semibold text-foreground sm:text-lg">
                {metricsDisplay.totalRoutes ?? "—"}
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-2.5 sm:p-3">
              <dt className="text-foreground/60">ACE coverage</dt>
              <dd className="text-base font-semibold text-foreground sm:text-lg">
                {metricsDisplay.coverage !== null ? `${metricsDisplay.coverage}%` : "—"}
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-2.5 sm:p-3">
              <dt className="text-foreground/60">Daily student riders</dt>
              <dd className="text-base font-semibold text-foreground sm:text-lg">
                {metricsDisplay.totalStudents !== null ? metricsDisplay.totalStudents.toLocaleString() : "—"}
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-2.5 sm:p-3">
              <dt className="text-foreground/60">Avg speed gain</dt>
              <dd className="text-base font-semibold text-foreground sm:text-lg">
                {metricsDisplay.meanSpeedGain !== null ? `${metricsDisplay.meanSpeedGain.toFixed(1)}%` : "—"}
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-2.5 sm:p-3 sm:col-span-2 lg:col-span-1">
              <dt className="text-foreground/60">Repeat exempt fleets</dt>
              <dd className="text-base font-semibold text-foreground sm:text-lg">
                {metricsDisplay.repeaters ?? "—"}
              </dd>
            </div>
          </dl>
          <nav className="space-y-1 text-sm">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-foreground/70 hover:bg-accent/40 hover:text-foreground"
                  }`}
                >
                  <span>{item.label}</span>
                  <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <section className="flex-1 space-y-4 lg:space-y-6 xl:space-y-8">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                Command center for ACE analytics
              </h1>
              <p className="text-sm text-muted-foreground">
                Compare enforcement performance, interrogate exemptions, and shepherd policy stories that stand up to executive scrutiny.
              </p>
            </div>
            <div className="rounded-full border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground sm:px-4">
              {metricsDisplay.aceRoutes !== null && metricsDisplay.totalRoutes !== null ? (
                <>
                  <span className="hidden sm:inline">
                    {metricsDisplay.aceRoutes} ACE routes | {metricsDisplay.totalRoutes - metricsDisplay.aceRoutes} expansion targets
                  </span>
                  <span className="sm:hidden">
                    {metricsDisplay.aceRoutes} ACE | {metricsDisplay.totalRoutes - metricsDisplay.aceRoutes} targets
                  </span>
                </>
              ) : (
                <span>Loading route coverage…</span>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto text-xs font-medium text-foreground/70 lg:hidden">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 transition-colors ${
                    active
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border/60 bg-background/50 hover:border-primary/40"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="space-y-6 lg:space-y-8">{children}</div>
      </section>
      </div>
    </div>
  );
}
