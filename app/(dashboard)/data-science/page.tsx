"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { FormEvent } from "react";
import type { FeatureCollection } from "geojson";
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
} from "recharts";
import { Brain, Database, Loader2, Calculator, FileText, Zap, Target } from "lucide-react";
import type { ForecastPayload, RiskRow } from "@/lib/aceApi";
import type { AnalystScenario, DocumentationLink, StudentDbRecipe } from "@/lib/data/insights";
const AskAI = dynamic(() => import("@/components/AskAI"), { ssr: false });

const systemPrompt = `You are the ACE Transit Intelligence Copilot. Your charter:
- Reason about Automated Camera Enforcement (ACE) bus lane violations and CUNY rider demand.
- Join ACE, ridership, speed, congestion pricing, and curb regulation context.
- When unsure, ask for queries or recommend validation steps. Always cite data sources.
- Prefer SQL for structured pulls, Python for modeling, and Mapbox/Deck.gl for spatial visuals.
- Produce executive-ready narratives with next actions and confidence levels.`;

export default function DataSciencePage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; jobId?: string }>(null);
  const [showExplain, setShowExplain] = useState(false);
  const [starterPrompts, setStarterPrompts] = useState<string[]>([]);
  const [studentPrompts, setStudentPrompts] = useState<string[]>([]);
  const [analystScenarios, setAnalystScenarios] = useState<AnalystScenario[]>([]);
  const [documents, setDocuments] = useState<DocumentationLink[]>([]);
  const [recipes, setRecipes] = useState<StudentDbRecipe[]>([]);
  const [curatedError, setCuratedError] = useState<string | null>(null);
  const [curatedLoading, setCuratedLoading] = useState<boolean>(true);

  const DEFAULT_FORECAST_ROUTE = "Q46";
  const DEFAULT_RISK_LIMIT = 20;
  const DEFAULT_AVG_SPEED = 8.5;
  const DEFAULT_TRIPS_PER_HOUR = 22;

  const notebookBBaseLabel =
    process.env.NEXT_PUBLIC_NOTEBOOK_B_BASE || process.env.NEXT_PUBLIC_ACE_API_BASE || "Notebook B API";

  const modelApiRef = useRef<null | typeof import("@/lib/aceApi").aceApi>(null);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const [forecastRouteId, setForecastRouteId] = useState<string>(DEFAULT_FORECAST_ROUTE);
  const [forecastData, setForecastData] = useState<ForecastPayload | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const [riskLimit, setRiskLimit] = useState<number>(DEFAULT_RISK_LIMIT);
  const [riskRows, setRiskRows] = useState<RiskRow[]>([]);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  const [avgSpeedMph, setAvgSpeedMph] = useState<number>(DEFAULT_AVG_SPEED);
  const [tripsPerHour, setTripsPerHour] = useState<number>(DEFAULT_TRIPS_PER_HOUR);
  const [riskScoreValue, setRiskScoreValue] = useState<number | null>(null);
  const [riskScoreLoading, setRiskScoreLoading] = useState(false);
  const [riskScoreError, setRiskScoreError] = useState<string | null>(null);

  const [hotspotsData, setHotspotsData] = useState<FeatureCollection | null>(null);
  const [hotspotsLoading, setHotspotsLoading] = useState(false);
  const [hotspotsError, setHotspotsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCurated() {
      setCuratedLoading(true);
      try {
        const res = await fetch(
          "/api/insights/curated?include=starterPrompts,studentPrompts,analystScenarios,studentDbRecipes,documents",
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error || "Failed to load curated AI assets");
        const data = json?.data || {};
        if (!cancelled) {
          setStarterPrompts(
            Array.isArray(data.starterPrompts)
              ? (data.starterPrompts as Array<{ prompt: string }>).map((item) => item.prompt)
              : []
          );
          setStudentPrompts(
            Array.isArray(data.studentPrompts)
              ? (data.studentPrompts as Array<{ prompt: string }>).map((item) => item.prompt)
              : []
          );
          setAnalystScenarios(Array.isArray(data.analystScenarios) ? (data.analystScenarios as AnalystScenario[]) : []);
          setRecipes(Array.isArray(data.studentDbRecipes) ? (data.studentDbRecipes as StudentDbRecipe[]) : []);
          setDocuments(Array.isArray(data.documents) ? (data.documents as DocumentationLink[]) : []);
          setCuratedError(null);
        }
      } catch (error) {
        console.error("Unable to load AI curated datasets", error);
        if (!cancelled) {
          setStarterPrompts([]);
          setStudentPrompts([]);
          setAnalystScenarios([]);
          setRecipes([]);
          setDocuments([]);
          setCuratedError("Unable to load curated AI references. Some panels below may be empty.");
        }
      } finally {
        if (!cancelled) {
          setCuratedLoading(false);
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
    const base = process.env.NEXT_PUBLIC_ACE_API_BASE;
    if (!base) {
      setModelError("Model API base URL is not configured.");
      return () => {
        cancelled = true;
      };
    }

    import("@/lib/aceApi")
      .then((mod) => {
        if (cancelled) return;
        modelApiRef.current = mod.aceApi;
        setModelReady(true);
        setModelError(null);
      })
      .catch((error) => {
        console.error("Unable to initialize Model API client", error);
        if (!cancelled) {
          setModelReady(false);
          setModelError("Model API client is unavailable right now.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const prompts = useMemo(() => starterPrompts.slice(0, 5), [starterPrompts]);
  const studentPromptSuggestions = useMemo(() => studentPrompts.slice(0, 4), [studentPrompts]);

  const fetchForecast = useCallback(
    async (route: string) => {
      if (!modelApiRef.current) {
        setForecastError("Model API is not ready.");
        return;
      }
      const normalized = route.trim();
      if (!normalized) {
        setForecastError("Route ID is required.");
        return;
      }
      setForecastLoading(true);
      try {
        const data = await modelApiRef.current.forecast(normalized);
        if (!data) {
          setForecastData(null);
          setForecastError(`No forecast available for ${normalized}. Try another route.`);
        } else {
          setForecastData(data);
          setForecastError(null);
        }
      } catch (error) {
        console.error("Failed to load forecast", error);
        setForecastError("Unable to load forecast right now.");
      } finally {
        setForecastLoading(false);
      }
    },
    []
  );

  const fetchRiskTop = useCallback(
    async (limit: number) => {
      if (!modelApiRef.current) {
        setRiskError("Model API is not ready.");
        return;
      }
      const clamped = Math.min(200, Math.max(1, Math.round(limit)));
      setRiskLimit(clamped);
      setRiskLoading(true);
      try {
        const rows = await modelApiRef.current.riskTop(clamped);
        setRiskRows(rows);
        setRiskError(null);
      } catch (error) {
        console.error("Failed to load risk leaderboard", error);
        setRiskError("Unable to load risk leaderboard.");
      } finally {
        setRiskLoading(false);
      }
    },
    []
  );

  const fetchRiskScore = useCallback(
    async (speed: number, trips: number) => {
      if (!modelApiRef.current) {
        setRiskScoreError("Model API is not ready.");
        return;
      }
      const speedValue = Math.max(0, Number.isFinite(speed) ? speed : 0);
      const tripsValue = Math.max(0, Number.isFinite(trips) ? trips : 0);
      setAvgSpeedMph(speedValue);
      setTripsPerHour(tripsValue);
      setRiskScoreLoading(true);
      try {
        const res = await modelApiRef.current.riskScore(speedValue, tripsValue);
        setRiskScoreValue(res.risk_score ?? null);
        setRiskScoreError(null);
      } catch (error) {
        console.error("Failed to score scenario", error);
        setRiskScoreError("Unable to score the scenario.");
      } finally {
        setRiskScoreLoading(false);
      }
    },
    []
  );

  const fetchHotspots = useCallback(async () => {
    if (!modelApiRef.current) {
      setHotspotsError("Model API is not ready.");
      return;
    }
    setHotspotsLoading(true);
    try {
      const gj = await modelApiRef.current.hotspots();
      setHotspotsData(gj);
      setHotspotsError(null);
    } catch (error) {
      console.error("Failed to load hotspots", error);
      setHotspotsError("Unable to load hotspots data.");
    } finally {
      setHotspotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!modelReady) return;
    fetchForecast(DEFAULT_FORECAST_ROUTE);
    fetchRiskTop(DEFAULT_RISK_LIMIT);
    fetchRiskScore(DEFAULT_AVG_SPEED, DEFAULT_TRIPS_PER_HOUR);
    fetchHotspots();
  }, [modelReady, fetchForecast, fetchRiskTop, fetchRiskScore, fetchHotspots]);

  const forecastChartData = useMemo(() => {
    if (!forecastData) return [] as Array<{
      date: string;
      history?: number | null;
      forecast?: number | null;
      ciLow?: number | null;
      ciHigh?: number | null;
    }>;

    const map = new Map<string, {
      date: string;
      history?: number | null;
      forecast?: number | null;
      ciLow?: number | null;
      ciHigh?: number | null;
    }>();

    const ensureEntry = (label: string) => {
      const key = label || "";
      const existing = map.get(key);
      if (existing) return existing;
      const entry = { date: key } as {
        date: string;
        history?: number | null;
        forecast?: number | null;
        ciLow?: number | null;
        ciHigh?: number | null;
      };
      map.set(key, entry);
      return entry;
    };

    const addSeries = (
      dates: string[] | undefined,
      values: (number | null | undefined)[] | undefined,
      prop: "history" | "forecast" | "ciLow" | "ciHigh"
    ) => {
      if (!Array.isArray(dates) || !Array.isArray(values)) return;
      const length = Math.min(dates.length, values.length);
      for (let i = 0; i < length; i += 1) {
        const rawDate = dates[i];
        if (!rawDate) continue;
        const label = typeof rawDate === "string" ? rawDate : String(rawDate);
        const value = Number(values[i] ?? null);
        const entry = ensureEntry(label);
        entry[prop] = Number.isFinite(value) ? value : null;
      }
    };

    addSeries(forecastData.history?.date, forecastData.history?.history, "history");
    addSeries(forecastData.forecast?.date, forecastData.forecast?.forecast, "forecast");

    const ciLowDates = forecastData.ci_low?.date ?? forecastData.forecast?.date ?? forecastData.history?.date;
    const ciHighDates = forecastData.ci_high?.date ?? forecastData.forecast?.date ?? forecastData.history?.date;
    addSeries(ciLowDates, forecastData.ci_low?.ci_low, "ciLow");
    addSeries(ciHighDates, forecastData.ci_high?.ci_high, "ciHigh");

    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }, [forecastData]);

  const riskTopChartData = useMemo(() => {
    if (!riskRows.length) return [] as Array<{ label: string; score: number }>;
    const grouped = new Map<string, RiskRow>();
    for (const row of riskRows) {
      if (!grouped.has(row.route_id)) {
        grouped.set(row.route_id, row);
      }
    }
    return Array.from(grouped.entries())
      .map(([route, row]) => ({
        label: `${route}@${row.hour_of_day}:00`,
        score: Number(row.risk_score ?? 0),
      }))
      .slice(0, 12);
  }, [riskRows]);

  const hotspotChartData = useMemo(() => {
    if (!hotspotsData || !Array.isArray(hotspotsData.features)) return [] as Array<{ label: string; value: number }>;
    const counts = hotspotsData.features
      .map((feature) => {
        const count = (feature as any)?.properties?.count;
        const parsed = Number(count ?? 0);
        return Number.isFinite(parsed) ? parsed : 0;
      })
      .sort((a, b) => b - a)
      .slice(0, 15);
    return counts.map((value, index) => ({ label: `#${index + 1}`, value }));
  }, [hotspotsData]);

  const totalRiskRoutes = useMemo(() => new Set(riskRows.map((row) => row.route_id)).size, [riskRows]);
  const totalHotspotCount = useMemo(
    () => (Array.isArray(hotspotsData?.features) ? hotspotsData!.features.length : 0),
    [hotspotsData]
  );

  const handleForecastSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      fetchForecast(forecastRouteId);
    },
    [fetchForecast, forecastRouteId]
  );

  const handleRiskTopSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      fetchRiskTop(riskLimit);
    },
    [fetchRiskTop, riskLimit]
  );

  const handleRiskScoreSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      fetchRiskScore(avgSpeedMph, tripsPerHour);
    },
    [fetchRiskScore, avgSpeedMph, tripsPerHour]
  );

  async function onPredict() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/ml/predict", { method: "POST" });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setResult({ ok: false });
    } finally {
      setRunning(false);
    }
  }

  async function onSimulate() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/ml/simulate", { method: "POST" });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setResult({ ok: false });
    } finally {
      setRunning(false);
    }
  }

  const COLORS = [
    "var(--chart-1)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-2)",
    "var(--chart-5)",
    "var(--chart-8)",
    "var(--chart-7)",
    "var(--chart-6)",
  ];

  const mlMetrics = [
    { name: "Accuracy", value: 87, target: 90, color: "green" },
    { name: "Precision", value: 82, target: 85, color: "blue" },
    { name: "Recall", value: 91, target: 88, color: "orange" },
    { name: "F1 Score", value: 86, target: 87, color: "purple" }
  ];

  const queryComplexity = [
    { name: "Simple", count: 45, percentage: 35 },
    { name: "Medium", count: 67, percentage: 52 },
    { name: "Complex", count: 17, percentage: 13 }
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Data Science & AI</h1>
        <p className="text-sm text-foreground/70">Advanced analytics, ML predictions, and intelligent workflow orchestration.</p>
      </header>
      {curatedError && (
        <div className="rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-xs text-destructive">
          {curatedError}
        </div>
      )}
      <section aria-labelledby="datascience-brief" className="rounded-xl border border-border/60 bg-card/70 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="datascience-brief" className="text-sm font-semibold text-foreground">Pipeline checklist</h2>
            <p className="text-xs text-muted-foreground">
              All agents connected to Neon Postgres, Socrata APIs, and real-time data streams. Ready for complex multi-step analysis.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="default" className="badge-positive">ML Agent: Ready</Badge>
            <Badge variant="default" className="badge-info">NL Query: Ready</Badge>
            <Badge variant="default" className="badge-accent">Workflow: Ready</Badge>
          </div>
        </div>
      </section>
      <div className="text-xs">
        <button onClick={() => setShowExplain((s) => !s)} className="rounded-md border border-foreground/10 hover:border-foreground/20 px-2 py-1 transition-colors">
          {showExplain ? "Hide explanation" : "Explain this view"}
        </button>
        {showExplain && (
          <div className="mt-2 rounded-md border border-foreground/10 p-3 text-foreground/80">
            Use these controls to call stubbed ML endpoints and view raw responses. The Ask AI panel streams a concise text summary using available tools.
          </div>
        )}
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="tools">Tools & APIs</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Brain className="h-5 w-5" />
                  ML Prediction Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Statistical forecasting and policy simulation</p>
                <div className="space-y-2">
                  <p className="text-xs font-medium">Available Tools:</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">forecast_violations</Badge>
                    <Badge variant="secondary" className="text-xs">simulate_policy_impact</Badge>
                    <Badge variant="secondary" className="text-xs">comparative_analysis</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Database className="h-5 w-5" />
                  Natural Language Query Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Parse queries and generate SQL</p>
                <div className="space-y-2">
                  <p className="text-xs font-medium">Available Tools:</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">parse_query_intent</Badge>
                    <Badge variant="secondary" className="text-xs">generate_sql_query</Badge>
                    <Badge variant="secondary" className="text-xs">validate_data_query</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="h-5 w-5" />
                  Workflow Orchestration Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Coordinate complex multi-step analysis</p>
                <div className="space-y-2">
                  <p className="text-xs font-medium">Available Tools:</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">orchestrate_campus_study</Badge>
                    <Badge variant="secondary" className="text-xs">orchestrate_policy_analysis</Badge>
                    <Badge variant="secondary" className="text-xs">orchestrate_emergency_response</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  ML Model Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mlMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--chart-5)" name="Current" />
                    <Bar dataKey="target" fill="var(--chart-3)" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Query Complexity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={queryComplexity}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="var(--chart-5)"
                      dataKey="count"
                    >
                      {queryComplexity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Model API insights</h3>
              <p className="text-xs text-foreground/60">
                Forecasts, risk rankings, and hotspots stream from {notebookBBaseLabel}. Each card notes the endpoint it calls so analysts know exactly where the numbers come from.
              </p>
            </div>
            {modelError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {modelError}
              </div>
            ) : !modelReady ? (
              <div className="flex items-center gap-2 rounded-md border border-foreground/10 bg-foreground/5 px-3 py-2 text-xs text-foreground/60">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Connecting to Model API…
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span>Route forecast</span>
                        <span className="text-xs font-normal text-foreground/60">Route: {forecastRouteId || "—"}</span>
                      </CardTitle>
                      <p className="mt-1 text-xs text-foreground/60">
                        Notebook B <code className="font-mono text-[11px]">/forecast/:route</code> blends historical ACE violations with a short-term projection. Pair with leadership briefings or service alerts.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleForecastSubmit} className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                        <label className="flex flex-col text-xs font-medium text-foreground/80 sm:w-auto">
                          Route ID
                          <Input
                            value={forecastRouteId}
                            onChange={(event) => setForecastRouteId(event.target.value.toUpperCase())}
                            placeholder="e.g. Q46"
                            className="mt-1 h-8 text-sm"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={!modelReady || forecastLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {forecastLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                              Loading
                            </>
                          ) : (
                            "Load forecast"
                          )}
                        </button>
                      </form>
                      {forecastError && (
                        <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                          {forecastError}
                        </div>
                      )}
                      <div className="h-64">
                        {forecastLoading && !forecastChartData.length ? (
                          <div className="flex h-full items-center justify-center gap-2 text-xs text-foreground/60">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Loading forecast…
                          </div>
                        ) : forecastChartData.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={forecastChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Line type="monotone" dataKey="history" stroke="var(--chart-1)" dot={false} name="History" />
                              <Line type="monotone" dataKey="forecast" stroke="var(--chart-3)" strokeDasharray="5 3" dot={false} name="Forecast" />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-center text-xs text-foreground/60">
                            No forecast data yet. Try another route ID.
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-[11px] text-muted-foreground">Source: {notebookBBaseLabel}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span>Risk leaderboard</span>
                        <span className="text-xs font-normal text-foreground/60">{totalRiskRoutes} routes</span>
                      </CardTitle>
                      <p className="mt-1 text-xs text-foreground/60">
                        Notebook B <code className="font-mono text-[11px]">/risk/top</code> surfaces the highest-risk stop-hours. Refresh after schedule changes to keep camera placements aligned with current demand.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleRiskTopSubmit} className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                        <label className="flex flex-col text-xs font-medium text-foreground/80 sm:w-auto">
                          Limit (1-200)
                          <Input
                            type="number"
                            min={1}
                            max={200}
                            value={riskLimit}
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              setRiskLimit(Number.isFinite(next) ? next : 0);
                            }}
                            className="mt-1 h-8 text-sm"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={!modelReady || riskLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {riskLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                              Loading
                            </>
                          ) : (
                            "Refresh"
                          )}
                        </button>
                      </form>
                      {riskError && (
                        <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                          {riskError}
                        </div>
                      )}
                      <div className="h-64">
                        {riskLoading && !riskTopChartData.length ? (
                          <div className="flex h-full items-center justify-center gap-2 text-xs text-foreground/60">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Loading risk rankings…
                          </div>
                        ) : riskTopChartData.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={riskTopChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={70} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Bar dataKey="score" fill="var(--chart-2)" name="Risk score" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-center text-xs text-foreground/60">
                            No risk rows available.
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-foreground/60">Showing the strongest stop-hour per route across {riskRows.length} ranked rows.</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">Source: {notebookBBaseLabel}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Scenario risk scoring</CardTitle>
                      <p className="mt-1 text-xs text-foreground/60">
                        Notebook B <code className="font-mono text-[11px]">/risk/score</code> quantifies enforcement pressure for a single what-if. Use it during tabletop exercises or policy discussions.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleRiskScoreSubmit} className="mb-3 grid gap-2 sm:grid-cols-3">
                        <label className="flex flex-col text-xs font-medium text-foreground/80">
                          Avg speed (mph)
                          <Input
                            type="number"
                            step="0.1"
                            min={0}
                            value={avgSpeedMph}
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              setAvgSpeedMph(Number.isFinite(next) ? next : 0);
                            }}
                            className="mt-1 h-8 text-sm"
                          />
                        </label>
                        <label className="flex flex-col text-xs font-medium text-foreground/80">
                          Trips per hour
                          <Input
                            type="number"
                            step="0.1"
                            min={0}
                            value={tripsPerHour}
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              setTripsPerHour(Number.isFinite(next) ? next : 0);
                            }}
                            className="mt-1 h-8 text-sm"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={!modelReady || riskScoreLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {riskScoreLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                              Scoring…
                            </>
                          ) : (
                            "Score scenario"
                          )}
                        </button>
                      </form>
                      {riskScoreError && (
                        <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                          {riskScoreError}
                        </div>
                      )}
                      <div className="flex flex-col gap-3 rounded-lg border border-foreground/10 bg-foreground/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs text-foreground/60">Predicted risk score</p>
                          <p className="text-2xl font-semibold text-foreground/90">
                            {riskScoreValue != null && Number.isFinite(riskScoreValue) ? riskScoreValue.toFixed(3) : "—"}
                          </p>
                        </div>
                        {riskScoreLoading ? (
                          <div className="flex items-center gap-2 text-xs text-foreground/60">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Calculating…
                          </div>
                        ) : riskScoreValue != null && Number.isFinite(riskScoreValue) ? (
                          <ResponsiveContainer width={160} height={80}>
                            <BarChart data={[{ label: "score", value: riskScoreValue }]}>
                              <XAxis dataKey="label" hide />
                              <YAxis hide domain={[0, Math.max(riskScoreValue * 1.2, 1)]} />
                              <Tooltip />
                              <Bar dataKey="value" fill="var(--chart-3)" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-xs text-foreground/60">Submit a scenario to preview the score.</div>
                        )}
                      </div>
                      <p className="mt-3 text-[11px] text-muted-foreground">Source: {notebookBBaseLabel}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span>Hotspot histogram</span>
                        <span className="text-xs font-normal text-foreground/60">{totalHotspotCount} features</span>
                      </CardTitle>
                      <p className="mt-1 text-xs text-foreground/60">
                        Notebook B <code className="font-mono text-[11px]">/hotspots.geojson</code> clusters ACE violations. Pair the counts with the map view to dispatch teams where density is highest.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-foreground/60">Top 15 hotspot clusters ranked by count.</p>
                        <button
                          type="button"
                          onClick={() => fetchHotspots()}
                          disabled={!modelReady || hotspotsLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {hotspotsLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                              Loading
                            </>
                          ) : (
                            "Refresh"
                          )}
                        </button>
                      </div>
                      {hotspotsError && (
                        <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                          {hotspotsError}
                        </div>
                      )}
                      <div className="h-64">
                        {hotspotsLoading && !hotspotChartData.length ? (
                          <div className="flex h-full items-center justify-center gap-2 text-xs text-foreground/60">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Loading hotspots…
                          </div>
                        ) : hotspotChartData.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hotspotChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Bar dataKey="value" fill="var(--chart-5)" name="Count" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-center text-xs text-foreground/60">
                            No hotspot clusters returned.
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-[11px] text-muted-foreground">Source: {notebookBBaseLabel}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ML Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={onPredict}
                  disabled={running}
                  className="w-full rounded-lg border border-foreground/10 hover:border-foreground/20 p-4 text-left transition-colors"
                >
                  <div className="font-medium">Run Violation Forecast</div>
                  <div className="text-sm text-foreground/70">Statistical model with confidence intervals</div>
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Policy Simulation</CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={onSimulate}
                  disabled={running}
                  className="w-full rounded-lg border border-foreground/10 hover:border-foreground/20 p-4 text-left transition-colors"
                >
                  <div className="font-medium">Run Impact Analysis</div>
                  <div className="text-sm text-foreground/70">Scenario modeling and recommendations</div>
                </button>
              </CardContent>
            </Card>
          </div>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-foreground/5 p-4 rounded-lg overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Access Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">Neon Postgres Queries</div>
                    <p className="mt-1 text-xs text-foreground/60">Direct SQL access to ACE violations, route data, and campus information</p>
                  </li>
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">Socrata API Integration</div>
                    <p className="mt-1 text-xs text-foreground/60">NYC Open Data portal datasets with automatic pagination</p>
                  </li>
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">CUNY Campus Data</div>
                    <p className="mt-1 text-xs text-foreground/60">Geographic and enrollment data for spatial analysis</p>
                  </li>
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">MCP Server Tools</div>
                    <p className="mt-1 text-xs text-foreground/60">Standardized interface for external data sources</p>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Analysis Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">Statistical Forecasting</div>
                    <p className="mt-1 text-xs text-foreground/60">Linear regression, seasonal adjustment, confidence intervals</p>
                  </li>
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">Policy Simulation</div>
                    <p className="mt-1 text-xs text-foreground/60">Scenario modeling for ACE expansion, pricing changes</p>
                  </li>
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">Spatial Analysis</div>
                    <p className="mt-1 text-xs text-foreground/60">Geographic queries, hotspot detection, campus proximity</p>
                  </li>
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">Workflow Orchestration</div>
                    <p className="mt-1 text-xs text-foreground/60">Multi-step analysis coordination and synthesis</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student-Focused Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {studentPromptSuggestions.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setResult({ ok: true, jobId: prompt })}
                      className="w-full rounded-lg border border-foreground/10 px-3 py-2 text-left hover:border-foreground/30 transition-colors"
                      type="button"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SQL Recipes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {recipes.map((recipe, idx) => (
                    <div key={idx} className="rounded-lg border border-foreground/10 p-3">
                      <div className="font-medium text-foreground/90">{recipe.title}</div>
                      <p className="mt-1 text-xs text-foreground/60">{recipe.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      {result && (
        <pre className="text-xs bg-foreground/5 p-4 rounded-lg overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">System prompt sketch</h2>
        <pre className="text-xs leading-relaxed whitespace-pre-wrap bg-foreground/5 p-3 rounded-lg border border-foreground/10">
{systemPrompt}
        </pre>
        <p className="text-xs text-foreground/60">Pair this with tool metadata to wire the copilot into the dashboard or external teams.</p>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Recommended AI tools</h2>
        <ul className="space-y-2 text-sm text-foreground/80">
          <li className="rounded-lg border border-foreground/10 p-3">
            <div className="font-medium">sql.query(dataset, sql)</div>
            <p className="mt-1 text-xs text-foreground/60">Run parameterized ACE, ridership, or congestion pricing queries and stream tabular results.</p>
          </li>
          <li className="rounded-lg border border-foreground/10 p-3">
            <div className="font-medium">python.exec(code, files)</div>
            <p className="mt-1 text-xs text-foreground/60">Model violation forecasts, Monte Carlo simulations, or causal comparisons with pandas + statsmodels.</p>
          </li>
          <li className="rounded-lg border border-foreground/10 p-3">
            <div className="font-medium">viz.map(geojson, options)</div>
            <p className="mt-1 text-xs text-foreground/60">Render hotspots, route alignments, or pre/post CBD segments directly from the assistant.</p>
          </li>
          <li className="rounded-lg border border-foreground/10 p-3">
            <div className="font-medium">report.generate(sections)</div>
            <p className="mt-1 text-xs text-foreground/60">Assemble stakeholder-ready briefs with summary, metrics, visuals, and recommended actions.</p>
          </li>
        </ul>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Prompt library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setResult({ ok: true, jobId: prompt })}
              className="rounded-lg border border-foreground/10 px-3 py-2 text-left hover:border-foreground/30 transition-colors"
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground/60">Click a prompt to stage it. Replace this stub with direct calls into the assistant API.</p>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Scenario blueprints</h2>
        <ul className="space-y-3 text-sm text-foreground/80">
          {analystScenarios.map((scenario) => (
            <li key={scenario.title} className="rounded-lg border border-foreground/10 p-3">
              <div className="font-medium text-foreground/90">{scenario.title}</div>
              <div className="mt-1 text-xs text-foreground/60">Expected inputs: {scenario.expectedInputs}</div>
              <p className="mt-2 leading-relaxed">{scenario.description}</p>
              <p className="mt-2 text-xs text-foreground/60">Playbook: {scenario.playbook}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Reference material</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {documents.map((doc) => (
            <a key={doc.href} href={doc.href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-foreground/10 px-3 py-2 hover:border-foreground/30 transition-colors">
              <div className="font-medium text-foreground/90">{doc.title}</div>
              <p className="mt-1 text-xs text-foreground/60 leading-relaxed">{doc.summary}</p>
            </a>
          ))}
        </div>
      </div>
      <AskAI />
    </div>
  );
}
