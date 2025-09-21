"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRightIcon, MapPinIcon } from "lucide-react";
import {
  EXEMPT_REPEATERS,
  ROUTE_COMPARISONS,
} from "@/lib/data/insights";

type DashboardRoute = "/executive" | "/operations" | "/policy" | "/data-science";

const NAV_ITEMS: Array<{ href: DashboardRoute; label: string }> = [
  { href: "/executive", label: "Executive" },
  { href: "/operations", label: "Operations" },
  { href: "/policy", label: "Policy" },
  { href: "/data-science", label: "Data Science" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const metrics = useMemo(() => {
    const totalRoutes = ROUTE_COMPARISONS.length;
    const aceRoutes = ROUTE_COMPARISONS.filter((route) => route.aceEnforced).length;
    const coverage = totalRoutes ? Math.round((aceRoutes / totalRoutes) * 100) : 0;
    const totalStudents = ROUTE_COMPARISONS.reduce(
      (acc, route) => acc + route.averageWeekdayStudents,
      0
    );
    const avgSpeedGain = ROUTE_COMPARISONS.filter((route) => route.aceEnforced).reduce(
      (acc, route) => acc + route.speedChangePct,
      0
    );
    const meanSpeedGain = aceRoutes ? avgSpeedGain / aceRoutes : 0;
    return {
      totalRoutes,
      aceRoutes,
      coverage,
      totalStudents,
      repeaters: EXEMPT_REPEATERS.length,
      meanSpeedGain,
    };
  }, []);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 sm:px-6 lg:flex-row lg:gap-10">
      <aside className="lg:w-64 xl:w-72">
        <div className="sticky top-28 space-y-6 rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur supports-[backdrop-filter]:bg-card/80">
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
          <dl className="grid grid-cols-1 gap-3 text-xs">
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <dt className="text-foreground/60">Routes tracked</dt>
              <dd className="text-lg font-semibold text-foreground">{metrics.totalRoutes}</dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <dt className="text-foreground/60">ACE coverage</dt>
              <dd className="text-lg font-semibold text-foreground">{metrics.coverage}%</dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <dt className="text-foreground/60">Daily student riders</dt>
              <dd className="text-lg font-semibold text-foreground">
                {metrics.totalStudents.toLocaleString()}
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <dt className="text-foreground/60">Avg speed gain</dt>
              <dd className="text-lg font-semibold text-foreground">
                {metrics.meanSpeedGain.toFixed(1)}%
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <dt className="text-foreground/60">Repeat exempt fleets</dt>
              <dd className="text-lg font-semibold text-foreground">{metrics.repeaters}</dd>
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
      <section className="flex-1 space-y-6 lg:space-y-8">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                Command center for ACE analytics
              </h1>
              <p className="text-sm text-muted-foreground">
                Compare enforcement performance, interrogate exemptions, and shepherd policy stories that stand up to executive scrutiny.
              </p>
            </div>
            <div className="rounded-full border border-border/60 bg-background/60 px-4 py-2 text-xs text-muted-foreground">
              {metrics.aceRoutes} ACE routes | {metrics.totalRoutes - metrics.aceRoutes} expansion targets
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
        <div className="space-y-8">{children}</div>
      </section>
    </div>
  );
}
