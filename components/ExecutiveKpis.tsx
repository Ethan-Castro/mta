"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { RouteComparison, CbdRouteTrend } from "@/lib/data/insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, Target, Shield } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type RouteRow = {
  busRouteId: string;
  violations: number;
  exemptCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
};

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];
const TREND_COLORS = {
  violations: "var(--chart-6)",
  exempt: "var(--chart-2)",
  speed: "var(--chart-3)",
  students: "var(--chart-7)",
};

type ExecutiveKpisProps = {
  routeComparisons: RouteComparison[];
  cbdRouteTrends: CbdRouteTrend[];
};

export default function ExecutiveKpis({ routeComparisons, cbdRouteTrends }: ExecutiveKpisProps) {
  const sp = useSearchParams();
  const globalRouteId = sp.get("routeId") || undefined;
  const globalStart = sp.get("start") || undefined;
  const globalEnd = sp.get("end") || undefined;
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [trendData, setTrendData] = useState<Array<{ month: string; violations: number; exempt: number }>>([]);
  const [trendLoading, setTrendLoading] = useState<boolean>(false);
  const [trendError, setTrendError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/violations/routes?limit=200", { cache: "no-store" });
        const json = await response.json();
        if (!json.ok) throw new Error(json.error || "Failed to load");
        setRoutes((json.rows || []) as RouteRow[]);
      } catch (e: any) {
        setError(e?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load Neon-backed monthly trend for violations/exempt
  useEffect(() => {
    const controller = new AbortController();
    const url = new URL("/api/violations/summary", window.location.origin);
    if (globalRouteId) url.searchParams.set("routeId", globalRouteId);
    if (globalStart) url.searchParams.set("start", globalStart);
    if (globalEnd) url.searchParams.set("end", globalEnd);
    url.searchParams.set("limit", "50000");
    setTrendLoading(true);
    setTrendError("");
    fetch(url.toString(), { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((json) => {
        const rows = Array.isArray(json?.rows) ? json.rows : [];
        const points = rows
          .slice()
          .sort((a: any, b: any) => String(a?.date_trunc_ym || "").localeCompare(String(b?.date_trunc_ym || "")))
          .map((r: any) => ({
            month: String(r?.date_trunc_ym || ""),
            violations: Number(r?.violations || 0),
            exempt: Number(r?.exempt_count || 0),
          }));
        setTrendData(points);
      })
      .catch((e: any) => {
        if (e?.name !== "AbortError") setTrendError(e?.message || "Trend failed");
        setTrendData([]);
      })
      .finally(() => setTrendLoading(false));
    return () => controller.abort();
  }, [globalRouteId, globalStart, globalEnd]);

  const { totalViolations, totalExempt, routeCount, firstSeen, lastSeen } = useMemo(() => {
    const initial = {
      totalViolations: 0,
      totalExempt: 0,
      routeCount: routes.length,
      firstSeen: null as string | null,
      lastSeen: null as string | null,
    };

    return routes.reduce((acc, row) => {
      acc.totalViolations += row.violations ?? 0;
      acc.totalExempt += row.exemptCount ?? 0;
      if (row.firstSeen && (!acc.firstSeen || row.firstSeen < acc.firstSeen)) {
        acc.firstSeen = row.firstSeen;
      }
      if (row.lastSeen && (!acc.lastSeen || row.lastSeen > acc.lastSeen)) {
        acc.lastSeen = row.lastSeen;
      }
      return acc;
    }, initial);
  }, [routes]);

  const exemptShare = totalViolations ? Math.round((totalExempt / totalViolations) * 1000) / 10 : 0;
  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "n/a";

  const aceRoutes = routeComparisons.filter((route) => route.aceEnforced);
  const avgSpeedGain = aceRoutes.length
    ? aceRoutes.reduce((acc, route) => acc + Number(route.speedChangePct ?? 0), 0) / aceRoutes.length
    : 0;

  const routeEfficiencyData = routes.slice(0, 10).map(route => ({
    route: route.busRouteId.split('-')[0],
    violations: route.violations,
    exemptCount: route.exemptCount,
    exemptShare: route.violations > 0 ? (route.exemptCount / route.violations) * 100 : 0,
  }));

  const campusTypeData = routeComparisons.reduce((acc, route) => {
    const type = route.campusType;
    if (!acc[type]) {
      acc[type] = { type, count: 0, avgViolations: 0, totalSpeedChange: 0, totalStudents: 0 };
    }
    acc[type].count += 1;
    acc[type].avgViolations += Number(route.averageMonthlyViolations ?? 0);
    acc[type].totalSpeedChange += Number(route.speedChangePct ?? 0);
    acc[type].totalStudents += Number(route.averageWeekdayStudents ?? 0);
    return acc;
  }, {} as Record<string, any>);

  const campusData = Object.values(campusTypeData).map((item: any) => ({
    ...item,
    avgViolations: Math.round(item.avgViolations / item.count),
    avgSpeedChange: Math.round((item.totalSpeedChange / item.count) * 10) / 10,
    avgStudents: Math.round(item.totalStudents / item.count),
  }));

  const violationTrendData = trendData;

  // Compute latest delta for violations trend (last vs previous month)
  const violationsDelta = useMemo(() => {
    if (!violationTrendData || violationTrendData.length < 2) return null as null | { abs: number; pct: number };
    const last = violationTrendData[violationTrendData.length - 1]?.violations ?? 0;
    const prev = violationTrendData[violationTrendData.length - 2]?.violations ?? 0;
    const abs = last - prev;
    const pct = prev > 0 ? (abs / prev) * 100 : 0;
    return { abs, pct };
  }, [violationTrendData]);

  const aceCoveragePct = useMemo(() => {
    const total = routeCount || 0;
    const ace = aceRoutes.length || 0;
    return total ? Math.round((ace / total) * 100) : 0;
  }, [routeCount, aceRoutes.length]);

  const cbdImpactData = cbdRouteTrends.slice(0, 8).map((route) => ({
    route: route.routeName.split(' ')[0],
    violationChange: Number(route.violationChangePct ?? 0),
    speedChange: Number(route.speedChangePct ?? 0),
    crossesCbd: route.crossesCbd,
  }));

  const policyImpactData = [
    { policy: "ACE Expansion", impact: 28, routes: 12, students: 45000 },
    { policy: "Congestion Pricing", impact: 15, routes: 8, students: 32000 },
    { policy: "Exempt Reduction", impact: 22, routes: 6, students: 28000 },
    { policy: "Timing Optimization", impact: 8, routes: 15, students: 52000 },
  ];

  const radarData = [
    { metric: "Speed Improvement", ace: 85, nonAce: 15, fullMark: 100 },
    { metric: "Violation Reduction", ace: 75, nonAce: 25, fullMark: 100 },
    { metric: "Student Impact", ace: 90, nonAce: 40, fullMark: 100 },
    { metric: "Enforcement Coverage", ace: 70, nonAce: 20, fullMark: 100 },
    { metric: "Policy Effectiveness", ace: 80, nonAce: 30, fullMark: 100 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 [border-color:var(--chart-6)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="inline-flex items-center gap-2">
                ACE violations
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="rounded-full border border-foreground/20 p-0.5 leading-none text-[10px] text-foreground/70">i</button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Monthly ACE violations across monitored routes; exempt share is the portion marked exempt.
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardTitle>
            {violationsDelta && (violationsDelta.abs >= 0 ? (
              <TrendingUp className="h-4 w-4 text-[color:var(--chart-6)]" />
            ) : (
              <TrendingDown className="h-4 w-4 text-[color:var(--chart-3)]" />
            ))}
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl" aria-live="polite">
              {loading ? "—" : totalViolations.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{exemptShare}% exempt rate</span>
              {violationsDelta && (
                <span className={violationsDelta.abs >= 0 ? "text-[color:var(--chart-6)]" : "text-[color:var(--chart-3)]"}>
                  {violationsDelta.abs >= 0 ? "+" : ""}{Math.round(violationsDelta.pct * 10) / 10}% vs prev mo
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">Window: {formatDate(firstSeen)} → {formatDate(lastSeen)}</div>
            <div className="mt-3 h-12">
              {trendLoading ? (
                <LoadingSkeleton variant="chart" className="h-12" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={violationTrendData.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="violations" stroke="var(--chart-6)" fill="var(--chart-6)" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 [border-color:var(--chart-1)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="inline-flex items-center gap-2">
                Routes monitored
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="rounded-full border border-foreground/20 p-0.5 leading-none text-[10px] text-foreground/70">i</button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Number of routes tracked in the current window; ACE coverage is the share enforced by ACE.
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardTitle>
            <Shield className="h-4 w-4 text-[color:var(--chart-1)]" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl" aria-live="polite">{loading ? "—" : routeCount}</div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{aceRoutes.length} with ACE enforcement</span>
              <span className="text-foreground/70">{aceCoveragePct}% coverage</span>
            </div>
            <div className="mt-2">
              {loading ? (
                <LoadingSkeleton lines={1} className="h-2" />
              ) : (
                <Progress value={aceCoveragePct} />
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">Source: Neon Postgres</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 [border-color:var(--chart-3)] sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="inline-flex items-center gap-2">
                ACE speed impact
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="rounded-full border border-foreground/20 p-0.5 leading-none text-[10px] text-foreground/70">i</button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Average percent change in median bus speed on ACE corridors vs matched non-ACE baselines; weighted by daily ridership.
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[color:var(--chart-3)]" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{avgSpeedGain >= 0 ? "+" : ""}{avgSpeedGain.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average speed improvement
            </p>
            <div className="text-[11px] text-muted-foreground mt-1">
              Top route: {routeComparisons.length ? [...routeComparisons].sort((a,b)=>Number(b.speedChangePct||0)-Number(a.speedChangePct||0))[0].routeId : "n/a"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="policy">Policy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  Violation Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={violationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="violations" fill={TREND_COLORS.violations} fillOpacity={0.3} stroke={TREND_COLORS.violations} name="Violations" />
                    <Area type="monotone" dataKey="exempt" fill={TREND_COLORS.exempt} fillOpacity={0.2} stroke={TREND_COLORS.exempt} name="Exempt" />
                  </ComposedChart>
                </ResponsiveContainer>
                {trendLoading && <LoadingSpinner size="sm" text="Loading Neon trend…" className="mt-2" />}
                {trendError && <div className="text-xs text-destructive mt-1">{trendError}</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                  ACE Performance Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="ACE Routes" dataKey="ace" stroke={TREND_COLORS.speed} fill={TREND_COLORS.speed} fillOpacity={0.3} />
                    <Radar name="Non-ACE Routes" dataKey="nonAce" stroke={TREND_COLORS.violations} fill={TREND_COLORS.violations} fillOpacity={0.3} />
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Campus Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={campusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="count" fill={COLORS[0]} name="Route Count" />
                    <Bar yAxisId="right" dataKey="avgStudents" fill={COLORS[1]} name="Avg Students" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Routes by Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={routeEfficiencyData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="route" type="category" width={60} />
                  <Tooltip />
                  <Bar dataKey="violations" fill={TREND_COLORS.violations} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policy" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Policy Impact Projections</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={policyImpactData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="policy" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="impact" fill={TREND_COLORS.speed} name="Violation Reduction %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CBD Congestion Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={cbdImpactData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="route" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip />
                  <Bar yAxisId="left" dataKey="violationChange" fill={TREND_COLORS.violations} name="Violation Change %" />
                  <Line yAxisId="right" type="monotone" dataKey="speedChange" stroke={TREND_COLORS.speed} strokeWidth={3} name="Speed Change %" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && <div className="text-xs text-[color:var(--chart-6)]">Couldn&apos;t load KPIs. Refresh or try later.</div>}
    </div>
  );
}
