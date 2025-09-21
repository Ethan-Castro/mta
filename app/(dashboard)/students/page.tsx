"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import InsightCard from "@/components/InsightCard";
import {
  STUDENT_COMMUTE_PROFILES,
  STUDENT_DB_RECIPES,
  STUDENT_PROMPTS,
  VIOLATION_HOTSPOTS,
} from "@/lib/data/insights";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat("en-US");

const MapPanel = dynamic(() => import("@/components/MapPanel"), { ssr: false });

export default function StudentsPage() {
  const [campus, setCampus] = useState(STUDENT_COMMUTE_PROFILES[0]?.campus ?? "");

  const profile = useMemo(
    () => STUDENT_COMMUTE_PROFILES.find((item) => item.campus === campus) ?? STUDENT_COMMUTE_PROFILES[0],
    [campus]
  );

  const hotspotDetails = useMemo(
    () =>
      VIOLATION_HOTSPOTS.filter((hotspot) => profile?.hotspotIds.includes(hotspot.id)).map((hotspot) => ({
        ...hotspot,
        campusMatch: hotspot.campus === profile?.campus,
      })),
    [profile]
  );

  const coveragePercent = profile ? profile.aceCoverageShare : 0;
  const promptSuggestions = useMemo(() => STUDENT_PROMPTS.slice(0, 4), []);

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              CUNY Student Commute View
            </h1>
            <p className="text-sm text-muted-foreground">
              Understand how ACE enforcement changes the everyday ride for CUNY students, highlight hotspots,
              and prep campus-specific recommendations.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <label htmlFor="campus-select" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Focus campus
            </label>
            <Select value={profile?.campus ?? campus} onValueChange={setCampus}>
              <SelectTrigger id="campus-select" className="min-w-[220px]">
                <SelectValue placeholder="Select campus" />
              </SelectTrigger>
              <SelectContent align="end">
                {STUDENT_COMMUTE_PROFILES.map((item) => (
                  <SelectItem key={item.campus} value={item.campus}>
                    {item.campus}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm text-primary">
          <p>
            Aligns with Datathon Question 1: identify high-utilization CUNY routes, compare ACE vs non-ACE performance,
            and surface student-facing recommendations that executives can act on quickly.
          </p>
        </div>
      </header>

      {profile && (
        <section aria-labelledby="student-metrics" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 id="student-metrics" className="text-sm font-semibold text-foreground">
              Key campus metrics
            </h2>
            <span className="text-xs text-muted-foreground">
              Last refreshed from curated insight dataset · Swap campus to compare
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InsightCard
              title="Students riding daily"
              value={integerFormatter.format(profile.avgDailyStudents)}
              subline={`${profile.campusType} · ${profile.borough}`}
              trendLabel="ACE coverage share"
              trendDelta={percentFormatter.format(coveragePercent)}
              trendPositive={coveragePercent >= 0.5}
            />
            <InsightCard
              title={`${profile.primaryRoute.id} uplift`}
              value={`${profile.primaryRoute.speedChangePct.toFixed(1)}%`}
              subline={`${profile.primaryRoute.averageRideMinutes} min ride · ${profile.primaryRoute.reliabilityScore}`}
              trendLabel="Travel time delta"
              trendDelta={profile.travelTimeDelta}
              trendPositive
            />
            <InsightCard
              title="Comparison route"
              value={profile.comparisonRoute.id}
              subline={`${profile.comparisonRoute.name}`}
              trendLabel="Speed change"
              trendDelta={`${profile.comparisonRoute.speedChangePct.toFixed(1)}%`}
              trendPositive={profile.comparisonRoute.speedChangePct >= 0}
            />
            <InsightCard
              title="Hotspots monitored"
              value={`${hotspotDetails.length}`}
              subline="Repeat exempt locations flagged for campus action"
              trendLabel="Needs ACE?"
              trendDelta={profile.nonAceRoute.aceEnforced ? "Covered" : "Add cameras"}
              trendPositive={profile.nonAceRoute.aceEnforced}
            />
          </div>
        </section>
      )}

      {profile && (
        <section aria-labelledby="commute-snapshot" className="space-y-4">
          <div className="flex flex-col gap-2">
            <h2 id="commute-snapshot" className="text-sm font-semibold text-foreground">
              Commute snapshot
            </h2>
            <p className="text-xs text-muted-foreground">
              Use this comparison to brief leadership on how ACE is working today, what alternatives students use, and
              where pressure is building without camera coverage.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-xl border border-border/60 bg-card/70 p-4">
              <h3 className="text-sm font-semibold text-foreground">Primary route</h3>
              <p className="text-xs text-muted-foreground">ACE-enforced student backbone</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Route</dt>
                  <dd className="font-medium">{profile.primaryRoute.id}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Speed change</dt>
                  <dd className="font-medium">{profile.primaryRoute.speedChangePct.toFixed(1)}%</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Ride time</dt>
                  <dd className="font-medium">{profile.primaryRoute.averageRideMinutes} min</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                {profile.primaryRoute.reliabilityScore}
              </p>
            </article>
            <article className="rounded-xl border border-border/60 bg-card/70 p-4">
              <h3 className="text-sm font-semibold text-foreground">Comparison option</h3>
              <p className="text-xs text-muted-foreground">Alternate route when SBS or ACE service shifts</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Route</dt>
                  <dd className="font-medium">{profile.comparisonRoute.id}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Speed change</dt>
                  <dd className="font-medium">{profile.comparisonRoute.speedChangePct.toFixed(1)}%</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                {profile.comparisonRoute.note}
              </p>
            </article>
            <article className="rounded-xl border border-border/60 bg-card/70 p-4">
              <h3 className="text-sm font-semibold text-foreground">Non-ACE target</h3>
              <p className="text-xs text-muted-foreground">Students depend on this corridor without camera protections</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Route</dt>
                  <dd className="font-medium">{profile.nonAceRoute.id}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Speed change</dt>
                  <dd className="font-medium">{profile.nonAceRoute.speedChangePct.toFixed(1)}%</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                {profile.nonAceRoute.note}
              </p>
            </article>
          </div>
        </section>
      )}

      {profile && (
        <section aria-labelledby="timeline" className="space-y-4">
          <div className="flex flex-col gap-2">
            <h2 id="timeline" className="text-sm font-semibold text-foreground">
              Daily timeline checkpoints
            </h2>
            <p className="text-xs text-muted-foreground">
              Share these moments with stakeholders to show when enforcement, operations, or campus coordination matters most.
            </p>
          </div>
          <ol className="grid gap-3 text-sm md:grid-cols-3">
            {profile.timeline.map((entry) => (
              <li key={`${entry.label}-${entry.detail}`} className="rounded-xl border border-border/60 bg-card/70 p-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">{entry.label}</span>
                <p className="mt-2 text-foreground/90">{entry.detail}</p>
              </li>
            ))}
          </ol>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary/90">
            <p className="font-medium">Recommendation</p>
            <p className="mt-1 text-primary/80">{profile.recommendation}</p>
          </div>
        </section>
      )}

      {profile && (
        <section aria-labelledby="student-voices" className="space-y-4">
          <div className="flex flex-col gap-2">
            <h2 id="student-voices" className="text-sm font-semibold text-foreground">
              Student voices
            </h2>
            <p className="text-xs text-muted-foreground">
              Quotes collected during campus listening sessions to humanize the metrics and persuade decision makers.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {profile.studentVoices.map((quote) => (
              <blockquote key={quote} className="rounded-xl border border-border/60 bg-card/70 p-4 text-sm text-foreground/90">
                {quote}
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="student-map" className="space-y-4">
        <div className="flex flex-col gap-2">
          <h2 id="student-map" className="text-sm font-semibold text-foreground">
            Campus hotspot map
          </h2>
          <p className="text-xs text-muted-foreground">
            When the Neon Postgres connection is live, this map will refresh automatically with ACE violation coordinates
            filtered to the selected campus.
          </p>
        </div>
        <MapPanel
          height={320}
          markers={hotspotDetails.map((hotspot) => ({
            id: hotspot.id,
            longitude: hotspot.longitude,
            latitude: hotspot.latitude,
            color: hotspot.campusMatch ? "#0039a6" : "#f97316",
            title: `${hotspot.location} | ${hotspot.routeId}`,
            description: `${integerFormatter.format(hotspot.averageDailyViolations)} violations/day | ${hotspot.exemptSharePct}% exempt | ${hotspot.campus}`,
          }))}
          cluster={false}
          hoverPopups
          center={hotspotDetails.length ? [hotspotDetails[0].longitude, hotspotDetails[0].latitude] : [-73.95, 40.75]}
          zoom={hotspotDetails.length ? 11.5 : 10.5}
        />
        {profile && (
          <ul className="grid gap-3 text-sm text-foreground/80 md:grid-cols-2">
            {hotspotDetails.map((hotspot) => (
              <li key={hotspot.id} className="rounded-xl border border-border/60 bg-card/70 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{hotspot.routeId}</span>
                  <span>{hotspot.averageDailyViolations} per day</span>
                </div>
                <p className="mt-2 font-medium text-foreground">{hotspot.location}</p>
                <p className="mt-2 text-xs text-muted-foreground">{hotspot.highlight}</p>
              </li>
            ))}
            {hotspotDetails.length === 0 && (
              <li className="rounded-xl border border-dashed border-border/60 bg-card/40 p-4 text-xs text-muted-foreground">
                Live hotspot data will populate once the Neon Postgres integration is connected.
              </li>
            )}
          </ul>
        )}
      </section>

      <section aria-labelledby="student-prompts" className="space-y-4">
        <div className="flex flex-col gap-2">
          <h2 id="student-prompts" className="text-sm font-semibold text-foreground">
            Ask the ACE copilot
          </h2>
          <p className="text-xs text-muted-foreground">
            Drop these prompts into the chat assistant or API to generate tailored comparisons, visualizations, and briefings.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {promptSuggestions.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => navigator?.clipboard?.writeText(prompt).catch(() => undefined)}
              className="rounded-xl border border-border/60 bg-card/70 p-4 text-left text-sm text-foreground/90 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30"
            >
              {prompt}
              <span className="mt-2 block text-xs text-muted-foreground">Copied to clipboard when clicked</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="student-neon" className="space-y-4">
        <div className="flex flex-col gap-2">
          <h2 id="student-neon" className="text-sm font-semibold text-foreground">
            Ready for Neon Postgres
          </h2>
          <p className="text-xs text-muted-foreground">
            The following query templates will power live dashboards once the database connection is configured.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {STUDENT_DB_RECIPES.map((recipe) => (
            <article key={recipe.title} className="flex h-full flex-col rounded-xl border border-border/60 bg-card/70 p-4">
              <h3 className="text-sm font-semibold text-foreground">{recipe.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{recipe.description}</p>
              <pre className="mt-3 flex-1 overflow-auto rounded-lg border border-border/40 bg-foreground/5 p-3 text-[11px] leading-relaxed text-foreground/80">
{recipe.sql}
              </pre>
            </article>
          ))}
        </div>
        <div className="rounded-xl border border-border/60 bg-card/70 p-4 text-xs text-muted-foreground">
          <p>
            Tip: mirror these queries as stored views in Neon so the ACE copilot can pivot summaries, charts, and alerts without
            long-running SQL each time.
          </p>
        </div>
      </section>
    </div>
  );
}
