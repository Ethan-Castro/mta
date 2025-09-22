"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ExecutiveSummary from "@/components/ExecutiveSummary";
import ExecutiveKpis from "@/components/ExecutiveKpis";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { MessageSquare } from "lucide-react";
import InsightCard from "@/components/InsightCard";
import type { RouteComparison, CbdRouteTrend, ExemptRepeater } from "@/lib/data/insights";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Sparkline, { SparklinePoint } from "@/components/charts/Sparkline";
import { InsightAgentUIMessage } from "@/lib/agents/insightAgent";

const percent = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("en-US");

function formatPercent(value: number) {
  return `${percent.format(value)}%`;
}

function ExecutivePageContent() {
  const searchParams = useSearchParams();
  const globalRouteId = searchParams.get("routeId");
  const globalStart = searchParams.get("start");
  const globalEnd = searchParams.get("end");
  const [showExplain, setShowExplain] = useState(false);
  const [input, setInput] = useState("");
  const [selectedCampusType, setSelectedCampusType] = useState<string>("all");
  const { messages, sendMessage, status } = useChat<InsightAgentUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [routes, setRoutes] = useState<RouteComparison[]>([]);
  const [cbdRoutes, setCbdRoutes] = useState<CbdRouteTrend[]>([]);
  const [starterPrompts, setStarterPrompts] = useState<string[]>([]);
  const [repeaters, setRepeaters] = useState<ExemptRepeater[]>([]);
  const [curatedError, setCuratedError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCuratedData() {
      try {
        const res = await fetch(
          "/api/insights/curated?include=routes,cbdRoutes,starterPrompts,repeaters",
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error || "Failed to load curated insights");

        const data = json?.data || {};
        const routeData = Array.isArray(data.routes) ? (data.routes as RouteComparison[]) : [];
        const cbdData = Array.isArray(data.cbdRoutes) ? (data.cbdRoutes as CbdRouteTrend[]) : [];
        const promptData = Array.isArray(data.starterPrompts)
          ? (data.starterPrompts as Array<{ prompt: string }>).map((row) => row.prompt)
          : [];
        const repeaterData = Array.isArray(data.repeaters) ? (data.repeaters as ExemptRepeater[]) : [];

        if (!cancelled) {
          setRoutes(routeData);
          setCbdRoutes(cbdData);
          setStarterPrompts(promptData);
          setRepeaters(repeaterData);
          setCuratedError(null);
        }
      } catch (error) {
        console.error("Unable to load curated executive insights", error);
        if (!cancelled) {
          setCuratedError("Unable to load curated insights. Using empty defaults.");
          setRoutes([]);
          setCbdRoutes([]);
          setStarterPrompts([]);
          setRepeaters([]);
        }
      }
    }

    loadCuratedData();
    return () => {
      cancelled = true;
    };
  }, []);

  const campusTypeOptions = useMemo(() => {
    const unique = Array.from(new Set(routes.map((route) => route.campusType))).sort();
    return [
      { value: "all", label: "All campus types" },
      ...unique.map((type) => ({ value: type, label: type })),
    ];
  }, [routes]);

  const filteredRoutes = useMemo(() => {
    if (selectedCampusType === "all") return routes;
    return routes.filter((route) => route.campusType === selectedCampusType);
  }, [routes, selectedCampusType]);

  const filteredRouteIds = useMemo(() => new Set(filteredRoutes.map((route) => route.routeId)), [filteredRoutes]);

  const { aceSpeedGain, cbdViolationDrop, studentExposure, topRoutes, aceRouteCount } = useMemo(() => {
    const aceRoutesList = filteredRoutes.filter((route) => route.aceEnforced);
    const aceSpeedGain = aceRoutesList.length
      ? aceRoutesList.reduce((acc, route) => acc + Number(route.speedChangePct ?? 0), 0) / aceRoutesList.length
      : 0;
    const matchingCbdRoutes = cbdRoutes.filter((route) => filteredRouteIds.has(route.routeId));
    const cbdViolationDrop = matchingCbdRoutes.length
      ? matchingCbdRoutes.reduce((acc, route) => acc + Number(route.violationChangePct ?? 0), 0) /
        matchingCbdRoutes.length
      : 0;
    const studentExposure = filteredRoutes.reduce(
      (acc, route) => acc + Number(route.averageWeekdayStudents ?? 0),
      0
    );
    const topRoutes = filteredRoutes.length
      ? [...filteredRoutes]
          .sort((a, b) => Number(b.speedChangePct ?? 0) - Number(a.speedChangePct ?? 0))
          .slice(0, 3)
      : [];
    return {
      aceSpeedGain,
      cbdViolationDrop,
      studentExposure,
      topRoutes,
      aceRouteCount: aceRoutesList.length,
    };
  }, [filteredRoutes, filteredRouteIds, cbdRoutes]);

  const relevantRepeaterCount = useMemo(
    () =>
      repeaters.filter((repeater) =>
        Array.isArray(repeater.routes) && repeater.routes.some((routeId) => filteredRouteIds.has(routeId))
      ).length,
    [repeaters, filteredRouteIds]
  );

  const prompts = useMemo(() => starterPrompts.slice(0, 4), [starterPrompts]);

  const [trendData, setTrendData] = useState<SparklinePoint[]>([]);
  const [trendRouteId, setTrendRouteId] = useState<string | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);

  useEffect(() => {
    if (!topRoutes.length) {
      setTrendData([]);
      setTrendRouteId(null);
      return;
    }
    const focusRoute = (globalRouteId && filteredRoutes.find(r => r.routeId === globalRouteId)) || topRoutes[0];
    setTrendRouteId(focusRoute.routeId);
    setTrendLoading(true);
    setTrendError(null);

    const controller = new AbortController();
    const url = new URL(`/api/violations/routes/${encodeURIComponent(focusRoute.routeId)}`, window.location.origin);
    url.searchParams.set("limit", "720");
    if (globalStart) url.searchParams.set("start", globalStart);
    if (globalEnd) url.searchParams.set("end", globalEnd);
    fetch(url.toString(), {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        const points = (data?.summary || [])
          .slice()
          .sort((a: { month: string }, b: { month: string }) => a.month.localeCompare(b.month))
          .map((row: { month: string; violations: number }) => {
            const date = new Date(row.month);
            const label = Number.isNaN(date.getTime())
              ? row.month
              : date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
            return { label, value: Number(row.violations ?? 0) };
          });
        setTrendData(points);
      })
      .catch((error: any) => {
        if (error?.name !== "AbortError") {
          setTrendError("Unable to load route trend.");
          setTrendData([]);
        }
      })
      .finally(() => {
        setTrendLoading(false);
      });

    return () => controller.abort();
  }, [topRoutes, filteredRoutes, globalRouteId, globalStart, globalEnd]);

  const handleSubmit = (
    message: { text?: string },
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const text = message.text ?? input;
    if (!text.trim()) return;
    sendMessage({ text });
    setInput("");
  };
  return (
    <div className="space-y-4 sm:space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Executive</h1>
        <p className="text-sm text-foreground/70">KPIs, trends, and AI summaries.</p>
      </header>
      {curatedError && (
        <div className="rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-xs text-destructive">
          {curatedError}
        </div>
      )}
      <section aria-labelledby="executive-overview" className="rounded-xl border border-border/60 bg-card/70 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h2 id="executive-overview" className="text-sm font-semibold text-foreground">How to use this view</h2>
            <p className="text-xs text-muted-foreground">
              Answer Datathon Question 1 by comparing ACE-enabled routes with non-ACE corridors, tracking exempt share, and
              briefing leadership on the highest-impact recommendations.
            </p>
            <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <li>• Highlight campus routes with the greatest ACE speed gains.</li>
              <li>• Quantify exempt share and recurring fleets for rapid policy decisions.</li>
              <li>• Use the AI prompts to draft executive-ready talking points.</li>
              <li>• Update the summary with future Neon Postgres feeds for live metrics.</li>
            </ul>
          </div>
          <div className="flex min-w-[200px] flex-col gap-2 text-xs text-muted-foreground sm:min-w-[210px]">
            <label htmlFor="executive-campus-filter" className="font-medium uppercase tracking-wide">
              Filter by campus type
            </label>
            <Select value={selectedCampusType} onValueChange={setSelectedCampusType}>
              <SelectTrigger id="executive-campus-filter" className="text-sm">
                <SelectValue>
                  {campusTypeOptions.find((option) => option.value === selectedCampusType)?.label ?? "All campus types"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {campusTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InsightCard
          title="ACE speed uplift"
          value={formatPercent(aceSpeedGain)}
          subline="Average change on ACE-enabled campus routes"
          trendLabel="Routes tracked"
          trendDelta={`${aceRouteCount}`}
          trendPositive
        />
        <InsightCard
          title="CBD violation delta"
          value={formatPercent(Math.abs(cbdViolationDrop))}
          subline={cbdViolationDrop < 0 ? "Drop after congestion pricing" : "Increase after congestion pricing"}
          trendLabel="Routes crossing CBD"
          trendDelta={`${cbdRoutes.filter((route) => filteredRouteIds.has(route.routeId) && route.crossesCbd).length}`}
          trendPositive={cbdViolationDrop < 0}
        />
        <InsightCard
          title="Daily student exposure"
          value={integer.format(studentExposure)}
          subline="Students riding monitored corridors each weekday"
          trendLabel="Repeat exempt fleets"
          trendDelta={`${relevantRepeaterCount}`}
          trendPositive={relevantRepeaterCount === 0}
        />
      </div>
      {trendRouteId && (
        <section aria-labelledby="exec-trend" className="rounded-xl border border-border/60 bg-card/70 p-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="exec-trend" className="text-sm font-medium">Monthly violations trend</h2>
              <p className="text-xs text-muted-foreground">Neon-powered counts for the highlighted campus route.</p>
            </div>
            <span className="text-xs text-foreground/60">Route focus: {trendRouteId}</span>
          </div>
          {trendLoading ? (
            <div className="flex h-32 items-center justify-center text-xs text-muted-foreground sm:h-40">Loading trend…</div>
          ) : trendError ? (
            <div className="flex h-32 items-center justify-center text-xs text-muted-foreground sm:h-40">{trendError}</div>
          ) : trendData.length ? (
            <Sparkline data={trendData} height={180} valueFormatter={(value) => value.toLocaleString()} />
          ) : (
            <div className="flex h-32 items-center justify-center text-xs text-muted-foreground sm:h-40">
              No recent violations recorded for this route.
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">Tip: adjust the campus filter to compare other executive corridors.</p>
        </section>
      )}
      <section aria-labelledby="exec-narratives" className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="exec-narratives" className="text-sm font-medium">Narratives to brief</h2>
          <span className="text-xs text-foreground/60">Anchor updates to the three core business questions.</span>
        </div>
        <ul className="space-y-3 text-sm text-foreground/80">
          {topRoutes.map((route) => (
            <li key={route.routeId} className="rounded-lg border border-foreground/10 px-3 py-2">
              <div className="font-medium text-foreground/90">
                {route.routeId} - {route.routeName}
              </div>
              <div className="text-xs text-foreground/60">{route.campus} | {route.aceEnforced ? "ACE enforced" : "No ACE coverage"} | {formatPercent(route.speedChangePct)} speed change</div>
              <p className="mt-2 leading-relaxed text-foreground/80 text-sm">{route.narrative}</p>
            </li>
          ))}
          {topRoutes.length === 0 && (
            <li className="rounded-lg border border-dashed border-foreground/20 px-3 py-4 text-xs text-muted-foreground">
              No routes available for the selected campus type. Choose another filter to populate narratives.
            </li>
          )}
        </ul>
      </section>
      <div className="text-xs">
        <button onClick={() => setShowExplain((s) => !s)} className="rounded-md border border-foreground/10 hover:border-foreground/20 px-2 py-1 transition-colors">
          {showExplain ? "Hide explanation" : "Explain this view"}
        </button>
        {showExplain && (
          <div className="mt-2 rounded-md border border-foreground/10 p-3 text-foreground/80">
            High-level KPIs summarize recent ACE violations and exempt shares. Generate an AI summary for context over a selected time window.
          </div>
        )}
      </div>
      <ExecutiveKpis routeComparisons={routes} cbdRouteTrends={cbdRoutes} />
      <section aria-labelledby="exec-prompts" className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="exec-prompts" className="text-sm font-medium">Pre-drafted AI prompts</h2>
          <span className="text-xs text-foreground/60">Paste into the assistant or API to generate ready-to-send briefings.</span>
        </div>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="rounded-lg border border-foreground/10 px-3 py-2 text-left text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>
      <div>
        <ExecutiveSummary />
      </div>
      <div className="rounded-xl border border-foreground/10 p-4">
        <h2 className="text-sm font-medium mb-3">Ask the ACE assistant</h2>
        <div className="flex flex-col">
          <Conversation className="relative w-full" style={{ height: 280 }}>
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-6" />}
                  title="Ask for executive insights"
                  description="Summaries, key risks, and highlights"
                />
              ) : (
                messages.map((message) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <Response key={`${message.id}-${i}`}>
                                {part.text}
                              </Response>
                            );
                          default:
                            return null;
                        }
                      })}
                    </MessageContent>
                  </Message>
                ))
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <PromptInput onSubmit={handleSubmit} className="mt-3 relative">
            <PromptInputTextarea
              value={input}
              placeholder="Ask for an executive summary..."
              onChange={(e) => setInput(e.currentTarget.value)}
              className="pr-10"
            />
            <PromptInputSubmit
              status={status === "streaming" ? "streaming" : "ready"}
              disabled={!input.trim()}
              className="absolute bottom-1 right-1"
            />
          </PromptInput>
        </div>
      </div>
    </div>
  );
}

export default function ExecutivePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <ExecutivePageContent />
    </Suspense>
  );
}
