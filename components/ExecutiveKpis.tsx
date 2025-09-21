"use client";

import { useEffect, useMemo, useState } from "react";
import { getViolationTotals, getRouteTotals, getHotspots } from "@/lib/data/violations";
import { ROUTE_COMPARISONS, CBD_ROUTE_TRENDS, VIOLATION_HOTSPOTS } from "@/lib/data/insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
import { TrendingUp, TrendingDown, AlertTriangle, Users, MapPin, Activity, Target, Shield } from "lucide-react";

type RouteRow = {
  busRouteId: string;
  violations: number;
  exemptCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF7C7C"];
const TREND_COLORS = {
  violations: "#EF4444",
  exempt: "#F97316",
  speed: "#10B981",
  students: "#3B82F6",
};

export default function ExecutiveKpis() {
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

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

  const aceRoutes = ROUTE_COMPARISONS.filter(route => route.aceEnforced);
  const avgSpeedGain = aceRoutes.length
    ? aceRoutes.reduce((acc, route) => acc + route.speedChangePct, 0) / aceRoutes.length
    : 0;

  const routeEfficiencyData = routes.slice(0, 10).map(route => ({
    route: route.busRouteId.split('-')[0],
    violations: route.violations,
    exemptCount: route.exemptCount,
    exemptShare: route.violations > 0 ? (route.exemptCount / route.violations) * 100 : 0,
  }));

  const campusTypeData = ROUTE_COMPARISONS.reduce((acc, route) => {
    const type = route.campusType;
    if (!acc[type]) {
      acc[type] = { type, count: 0, avgViolations: 0, totalSpeedChange: 0, totalStudents: 0 };
    }
    acc[type].count++;
    acc[type].avgViolations += route.averageMonthlyViolations;
    acc[type].totalSpeedChange += route.speedChangePct;
    acc[type].totalStudents += route.averageWeekdayStudents;
    return acc;
  }, {} as Record<string, any>);

  const campusData = Object.values(campusTypeData).map((item: any) => ({
    ...item,
    avgViolations: Math.round(item.avgViolations / item.count),
    avgSpeedChange: Math.round((item.totalSpeedChange / item.count) * 10) / 10,
    avgStudents: Math.round(item.totalStudents / item.count),
  }));

  const violationTrendData = [
    { month: "Jan", violations: 45000, exempt: 12000, speed: 7.8 },
    { month: "Feb", violations: 42000, exempt: 11500, speed: 8.1 },
    { month: "Mar", violations: 48000, exempt: 13200, speed: 7.5 },
    { month: "Apr", violations: 46000, exempt: 12600, speed: 7.9 },
    { month: "May", violations: 44000, exempt: 11800, speed: 8.2 },
    { month: "Jun", violations: 43000, exempt: 11200, speed: 8.3 },
  ];

  const cbdImpactData = CBD_ROUTE_TRENDS.slice(0, 8).map(route => ({
    route: route.routeName.split(' ')[0],
    violationChange: route.violationChangePct,
    speedChange: route.speedChangePct,
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ACE Violations</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : totalViolations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {exemptShare}% exempt rate
            </p>
            <div className="text-[11px] text-muted-foreground mt-1">Window: {formatDate(firstSeen)} → {formatDate(lastSeen)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routes Monitored</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : routeCount}</div>
            <p className="text-xs text-muted-foreground">
              {aceRoutes.length} with ACE enforcement
            </p>
            <div className="text-[11px] text-muted-foreground mt-1">Source: Neon Postgres</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ACE Speed Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{avgSpeedGain.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average speed improvement
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="policy">Policy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Violation Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={violationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Area yAxisId="left" type="monotone" dataKey="violations" fill={TREND_COLORS.violations} fillOpacity={0.3} stroke={TREND_COLORS.violations} />
                    <Line yAxisId="right" type="monotone" dataKey="speed" stroke={TREND_COLORS.speed} strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  ACE Performance Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="ACE Routes" dataKey="ace" stroke={TREND_COLORS.speed} fill={TREND_COLORS.speed} fillOpacity={0.3} />
                    <Radar name="Non-ACE Routes" dataKey="nonAce" stroke={TREND_COLORS.violations} fill={TREND_COLORS.violations} fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Campus Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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

        <TabsContent value="routes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Routes by Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={routeEfficiencyData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="route" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="violations" fill={TREND_COLORS.violations} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Policy Impact Projections</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
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
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={cbdImpactData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="route" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="violationChange" fill={TREND_COLORS.violations} name="Violation Change %" />
                  <Line yAxisId="right" type="monotone" dataKey="speedChange" stroke={TREND_COLORS.speed} strokeWidth={3} name="Speed Change %" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && <div className="text-xs text-red-500">Couldn&apos;t load KPIs. Refresh or try later.</div>}
    </div>
  );
}
