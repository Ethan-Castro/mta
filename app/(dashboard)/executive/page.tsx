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

  const cbdChangeCopy =
    cbdViolationDrop === 0
      ? "held steady"
      : cbdViolationDrop < 0
      ? `dropped by ${formatPercent(Math.abs(cbdViolationDrop))}`
      : `rose by ${formatPercent(Math.abs(cbdViolationDrop))}`;

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
      <header className="animate-fade-up space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Executive</h1>
        <p className="text-sm text-foreground/70">Executive-level KPIs, trendlines, and AI-ready talking points.</p>
      </header>
      {curatedError && (
        <div className="animate-fade-up rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-xs text-destructive shadow-sm">
          {curatedError}
        </div>
      )}
      <section
        aria-labelledby="executive-overview"
        className="surface-card animate-fade-up animate-fade-up-delay-1 rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft-lg sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 id="executive-overview" className="text-sm font-semibold text-foreground">Headline</h2>
            <p className="text-sm text-foreground/80">
              ACE corridors improved average bus speeds by {formatPercent(Math.max(0, aceSpeedGain))} vs the prior window.
              CBD violations {cbdChangeCopy} over the same period.
              Exemptions and hotspots vary by campus type.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowExplain((s) => !s)}
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-background/80 px-3 py-1.5 text-xs font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {showExplain ? "Hide guide" : "Guide"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
              onClick={() => window.print()}
            >
              Export
            </button>
          </div>
        </div>
        {showExplain && (
          <div className="mt-3 rounded-md border border-foreground/10 bg-background/80 p-3 text-foreground/80 shadow-sm">
            <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <li>Compare ACE and non-ACE corridors.</li>
              <li>Quantify exempt share and recurring fleets.</li>
              <li>Use the AI prompts to generate briefings.</li>
              <li>Adjust the campus filter to reframe the story.</li>
            </ul>
          </div>
        )}
      </section>
      <div className="grid grid-cols-1 gap-3 animate-fade-up animate-fade-up-delay-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
        <section
          aria-labelledby="exec-trend"
          className="surface-card animate-fade-up animate-fade-up-delay-3 rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft-lg space-y-3 sm:p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="exec-trend" className="text-sm font-medium">Monthly violations trend</h2>
              <p className="text-xs text-muted-foreground">Monthly Neon counts for the highlighted campus route.</p>
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
              <div className="flex flex-col items-center gap-2">
                <span>No recent violations recorded for this route.</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const url = new URL(window.location.href);
                      const now = new Date();
                      const past = new Date(now);
                      past.setMonth(now.getMonth() - 12);
                      url.searchParams.set("start", past.toISOString());
                      url.searchParams.set("end", now.toISOString());
                      window.location.assign(url.toString());
                    }}
                    className="rounded-full border border-foreground/15 bg-background/80 px-3 py-1 text-[11px] text-foreground/80 hover:border-primary/40 hover:text-primary"
                  >
                    Try last 12 months
                  </button>
                  <button
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set("routeId", "M15-SBS,Q46");
                      window.location.assign(url.toString());
                    }}
                    className="rounded-full border border-foreground/15 bg-background/80 px-3 py-1 text-[11px] text-foreground/80 hover:border-primary/40 hover:text-primary"
                  >
                    Switch to M15-SBS, Q46
                  </button>
                </div>
              </div>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">Tip: adjust the campus filter to swap in another executive corridor.</p>
        </section>
      )}
      <section
        aria-labelledby="exec-narratives"
        className="surface-card animate-fade-up rounded-xl border border-foreground/10 bg-card/80 p-4 shadow-soft-lg space-y-3 sm:p-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="exec-narratives" className="text-sm font-medium">Narratives to brief</h2>
          <span className="text-xs text-foreground/60">Tie updates back to the three core business questions.</span>
        </div>
        <ul className="space-y-3 text-sm text-foreground/80">
          {topRoutes.map((route) => (
            <li
              key={route.routeId}
              className="rounded-lg border border-foreground/10 bg-background/80 px-3 py-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="font-medium text-foreground/90">
                {route.routeId} - {route.routeName}
              </div>
              <div className="text-xs text-foreground/60">{route.campus} | {route.aceEnforced ? "ACE enforced" : "No ACE coverage"} | {route.speedChangePct !== null ? formatPercent(route.speedChangePct) : "—"} speed change</div>
              <p className="mt-2 leading-relaxed text-foreground/80 text-sm">{route.narrative}</p>
            </li>
          ))}
          {topRoutes.length === 0 && (
            <li className="rounded-lg border border-dashed border-foreground/20 bg-background/70 px-3 py-4 text-xs text-muted-foreground">
              No routes available for the selected campus type. Choose another filter to populate narratives.
            </li>
          )}
        </ul>
      </section>
      <div className="animate-fade-up text-xs" />
      <ExecutiveKpis routeComparisons={routes} cbdRouteTrends={cbdRoutes} />
      <section
        aria-labelledby="exec-prompts"
        className="surface-card animate-fade-up rounded-xl border border-foreground/10 bg-card/80 p-4 shadow-soft-lg space-y-3 sm:p-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="exec-prompts" className="text-sm font-medium">Pre-drafted AI prompts</h2>
          <span className="text-xs text-foreground/60">Paste these into the assistant or API to generate ready-to-send briefings.</span>
        </div>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="group relative overflow-hidden rounded-lg border border-foreground/10 bg-background/80 px-3 py-2 text-left text-foreground/80 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              type="button"
            >
              <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
              <span className="relative z-10 block">{prompt}</span>
            </button>
          ))}
        </div>
      </section>
      <div className="animate-fade-up">
        <ExecutiveSummary />
      </div>
      <div className="surface-card animate-fade-up rounded-xl border border-foreground/10 bg-card/80 p-4 shadow-soft-lg sm:p-5">
        <h2 className="mb-3 text-sm font-medium">Ask the ACE assistant</h2>
        <div className="flex flex-col">
          <Conversation
            className="relative w-full overflow-hidden rounded-lg border border-foreground/10 bg-background/80 shadow-inner"
            style={{ height: 280 }}
          >
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-6" />}
                  title="Ask for executive insights"
                  description="Ask for summaries, key risks, and highlights"
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
          <PromptInput
            onSubmit={handleSubmit}
            className="relative mt-3 rounded-lg border border-foreground/10 bg-background/90 shadow-sm transition-all duration-300 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/30"
          >
            <PromptInputTextarea
              value={input}
              placeholder="Ask for an executive-ready summary..."
              onChange={(e) => setInput(e.currentTarget.value)}
              className="min-h-[60px] resize-none bg-transparent pr-12 text-sm focus:outline-none"
            />
            <PromptInputSubmit
              status={status === "streaming" ? "streaming" : "ready"}
              disabled={!input.trim()}
              className="absolute bottom-2 right-2 rounded-full bg-primary/90 text-primary-foreground shadow-sm transition-transform duration-300 hover:scale-105"
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
