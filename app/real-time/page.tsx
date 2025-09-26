import ToolsChat from "@/components/ToolsChat";
import SocialMonitor from "@/components/real-time/SocialMonitor";
import { aceApi } from "@/lib/aceApi";
import { getRouteTotals, getViolationTotals, type RouteTotalsRow } from "@/lib/data/violations";
import { isDbConfigured } from "@/lib/db";

export const metadata = {
  title: "Real-time | ACE Insight Studio",
  description: "Live view of updates with social embeds and chat",
};

const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 0 });
const dayFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const monthYearFormatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

type RouteWatchItem = {
  busRouteId: string;
  violations: number;
  exemptCount: number;
  lastSeen: string | null;
};

type LiveTotals = {
  totalViolations: number;
  totalExempt: number;
  activeRoutes: number;
  latestMonthIso: string | null;
};

type ModelHealth = {
  ok: boolean;
  message: string;
  ready: string[];
  degraded: string[];
};

const FALLBACK_ROUTES: RouteWatchItem[] = [
  { busRouteId: "M15-SBS", violations: 412, exemptCount: 58, lastSeen: "2024-05-19T14:30:00Z" },
  { busRouteId: "Bx12-SBS", violations: 361, exemptCount: 42, lastSeen: "2024-05-19T13:52:00Z" },
  { busRouteId: "B44-SBS", violations: 298, exemptCount: 51, lastSeen: "2024-05-19T12:05:00Z" },
  { busRouteId: "S79-SBS", violations: 245, exemptCount: 35, lastSeen: "2024-05-19T11:20:00Z" },
  { busRouteId: "Q46", violations: 201, exemptCount: 22, lastSeen: "2024-05-19T10:58:00Z" },
];

const FALLBACK_TOTALS: LiveTotals = {
  totalViolations: FALLBACK_ROUTES.reduce((acc, route) => acc + route.violations, 0),
  totalExempt: FALLBACK_ROUTES.reduce((acc, route) => acc + route.exemptCount, 0),
  activeRoutes: FALLBACK_ROUTES.length,
  latestMonthIso: "2024-05-01",
};

function formatRelative(date: Date) {
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  return relativeTimeFormatter.format(diffDays, "day");
}

export default async function Page() {
  const lookbackDays = 45;
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - lookbackDays);
  const windowStartIso = windowStart.toISOString();

  let usingLiveData = false;
  let fallbackReason: string | null = null;
  let totals: LiveTotals = { ...FALLBACK_TOTALS };
  let routes: RouteWatchItem[] = [...FALLBACK_ROUTES];

  if (isDbConfigured) {
    try {
      const [violationTotals, routeTotals] = await Promise.all([
        getViolationTotals({ start: windowStartIso }),
        getRouteTotals({ limit: 5, start: windowStartIso }),
      ]);

      totals = {
        totalViolations: violationTotals.totalViolations,
        totalExempt: violationTotals.totalExempt,
        activeRoutes: violationTotals.routes.size,
        latestMonthIso: violationTotals.months.at(-1) ?? null,
      };

      routes = routeTotals.map(
        (row: RouteTotalsRow): RouteWatchItem => ({
          busRouteId: row.busRouteId,
          violations: row.violations,
          exemptCount: row.exemptCount,
          lastSeen: row.lastSeen,
        })
      );

      usingLiveData = true;
    } catch {
      fallbackReason = "Database request failed. Using curated demo snapshot.";
    }
  } else {
    fallbackReason = "Live Neon connection missing. Showing curated demo insights.";
  }

  let modelStatus: ModelHealth = {
    ok: false,
    message: "Model API health endpoint is unreachable right now.",
    ready: [],
    degraded: [],
  };

  try {
    const health = await aceApi.health();
    const artifacts = Object.entries(health?.artifacts ?? {});
    const ready = artifacts.filter(([, status]) => Boolean(status)).map(([name]) => name);
    const degraded = artifacts.filter(([, status]) => !status).map(([name]) => name);
    modelStatus = {
      ok: Boolean(health?.ok),
      message: health?.ok
        ? ready.length
          ? `Artifacts ready: ${ready.join(", ")}`
          : "Model API responded successfully."
        : "Health check reported an issue.",
      ready,
      degraded,
    };
  } catch {
    // leave default model status in place
  }

  const exemptShare = totals.totalViolations ? totals.totalExempt / totals.totalViolations : 0;
  const dataWindowLabel = `${dayFormatter.format(windowStart)} - ${dayFormatter.format(now)}`;
  const latestMonthLabel = totals.latestMonthIso ? monthYearFormatter.format(new Date(totals.latestMonthIso)) : "n/a";
  const lastGeneratedLabel = dateTimeFormatter.format(now);

  const statusItems = [
    {
      label: "Neon data warehouse",
      ok: usingLiveData,
      value: usingLiveData ? "Connected" : "Demo mode",
      description: usingLiveData
        ? `Streaming ${totals.activeRoutes} active routes over the last ${lookbackDays} days.`
        : "Live database not available. Surfacing curated sample activity instead.",
      additional: fallbackReason && !usingLiveData ? fallbackReason : null,
    },
    {
      label: "ACE model API",
      ok: modelStatus.ok,
      value: modelStatus.ok ? "Operational" : "Attention",
      description: modelStatus.message,
      additional: modelStatus.degraded.length ? `Pending: ${modelStatus.degraded.join(", ")}` : null,
    },
    {
      label: "Social sentiment",
      ok: true,
      value: "Monitoring",
      description: "Aggregating official MTA posts from X and Instagram in real time.",
      additional: null,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-8 rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Real-time pulse</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">ACE Live Operations Center</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Monitoring the last {lookbackDays} days of ACE enforcement activity, automated model readiness, and public
              sentiment. Window {dataWindowLabel}.
            </p>
            {!usingLiveData && fallbackReason ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" aria-hidden />
                {fallbackReason}
              </span>
            ) : null}
          </div>
          <div className="rounded-2xl border border-primary/40 bg-background/60 px-5 py-4 text-right shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">Violations ({lookbackDays}d)</p>
            <p className="mt-2 text-3xl font-semibold text-primary">{integerFormatter.format(totals.totalViolations)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Exempt share {percentFormatter.format(exemptShare)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label={`Violations (${lookbackDays}d)`}
          value={integerFormatter.format(totals.totalViolations)}
          hint={`Window ${dataWindowLabel}`}
        />
        <SummaryCard
          label="Exempt share"
          value={percentFormatter.format(exemptShare)}
          description={`Exempt ${integerFormatter.format(totals.totalExempt)} of ${integerFormatter.format(totals.totalViolations)} total`}
          accent="warning"
        />
        <SummaryCard
          label="Routes observed"
          value={integerFormatter.format(totals.activeRoutes)}
          description={usingLiveData ? "Live Neon query of active ACE corridors." : "Snapshot of demo corridors."}
        />
        <SummaryCard
          label="Latest month processed"
          value={latestMonthLabel}
          description={usingLiveData ? "Live data refreshed nightly." : "Demo snapshot refreshed weekly."}
          hint={`Source ${usingLiveData ? "Neon connection" : "Curated sample"}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-7">
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold sm:text-base">System pulse</h2>
                <p className="text-xs text-muted-foreground">Automated health across data, models, and sentiment feeds.</p>
              </div>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Updated {lastGeneratedLabel}</span>
            </div>
            <div className="mt-4 space-y-3">
              {statusItems.map((item) => (
                <StatusRow key={item.label} {...item} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-5">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold sm:text-base">Route watchlist</h2>
                <p className="text-xs text-muted-foreground">Highest enforcement activity in the past {lookbackDays} days.</p>
              </div>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Sorted by violations</span>
            </div>
            {routes.length === 0 && usingLiveData ? (
              <p className="text-sm text-muted-foreground">
                No ACE violations recorded in the current window. Adjust the lookback period to widen coverage.
              </p>
            ) : (
              <div className="space-y-3">
                {routes.map((route, index) => (
                  <RouteWatchRow key={route.busRouteId} route={route} index={index} lookbackDays={lookbackDays} />
                ))}
              </div>
            )}
          </div>

          <SocialMonitor />
        </section>
        <aside className="space-y-4 lg:col-span-5">
          <ToolsChat />
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-5">
            <h3 className="text-sm font-semibold sm:text-base">Fast-track prompts</h3>
            <p className="text-xs text-muted-foreground">
              Drop one of these into the Tool-enabled chat to pivot from live context to deeper analysis.
            </p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60" aria-hidden />
                Compare ACE violation trends for M15-SBS versus B44-SBS since congestion pricing launched.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60" aria-hidden />
                Surface the top hotspots with rising exempt shares in the last quarter.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60" aria-hidden />
                Generate a briefing that blends social sentiment with ACE enforcement changes this week.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  hint?: string;
  description?: string;
  accent?: "default" | "success" | "warning";
};

function SummaryCard({ label, value, hint, description, accent = "default" }: SummaryCardProps) {
  const valueClass =
    accent === "success"
      ? "text-emerald-500"
      : accent === "warning"
      ? "text-amber-400"
      : "text-foreground";

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>{value}</p>
      {description ? <p className="mt-2 text-xs text-muted-foreground leading-snug">{description}</p> : null}
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}

type StatusRowProps = {
  label: string;
  value: string;
  description: string;
  ok: boolean;
  additional?: string | null;
};

function StatusRow({ label, value, description, ok, additional }: StatusRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/70 p-3">
      <span
        className={`${ok ? "bg-emerald-500" : "animate-pulse bg-amber-500"} mt-1 h-2.5 w-2.5 rounded-full`}
        aria-hidden
      />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{label}</p>
          <span className={`text-xs font-medium ${ok ? "text-emerald-500" : "text-amber-500"}`}>{value}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground leading-snug">{description}</p>
        {additional ? <p className="mt-1 text-[11px] text-muted-foreground/80">{additional}</p> : null}
      </div>
    </div>
  );
}

type RouteWatchRowProps = {
  route: RouteWatchItem;
  index: number;
  lookbackDays: number;
};

function RouteWatchRow({ route, index, lookbackDays }: RouteWatchRowProps) {
  const share = route.violations > 0 ? route.exemptCount / route.violations : 0;
  const lastSeenDate = route.lastSeen ? new Date(route.lastSeen) : null;
  const relative = lastSeenDate ? formatRelative(lastSeenDate) : null;
  const absolute = lastSeenDate ? dateTimeFormatter.format(lastSeenDate) : null;

  return (
    <div className="flex gap-3 rounded-xl border border-border/60 bg-background/70 p-3 sm:p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">#{index + 1}</div>
      <div className="flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="text-sm font-semibold sm:text-base">{route.busRouteId}</p>
            <p className="text-xs text-muted-foreground">
              Exempt share {percentFormatter.format(share)} · {integerFormatter.format(route.exemptCount)} exempt
            </p>
          </div>
          <div className="text-sm sm:text-base">
            <span className="font-semibold">{integerFormatter.format(route.violations)}</span>
            <span className="ml-1 text-xs text-muted-foreground">violations</span>
          </div>
        </div>
        {lastSeenDate ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Last recorded {relative} · {absolute}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            No recent detections in the past {lookbackDays} days.
          </p>
        )}
      </div>
    </div>
  );
}
