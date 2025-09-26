"use client";

import { Suspense, useMemo, useState } from "react";
import { FullscreenContainer } from "@/components/ui/fullscreen";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import CampusCharts from "./sections/CampusCharts";
import CongestionPricingChart from "./sections/CongestionPricingChart";
import ExemptVehiclesChart from "./sections/ExemptVehiclesChart";

type Section = {
  id: string;
  title: string;
  body: string;
  recommendation: string;
  embedUrl?: string;
};

type TocItem = {
  id: string;
  title: string;
};

const sections: Section[] = [
  {
    id: "q1-student-routes",
    title: "(1) Which MTA bus routes are highly utilized by CUNY students?",
    body:
      "For routes that are automated camera-enforced, how have bus speeds changed over time?",
    recommendation:
      "Compare a campus route you or someone you know utilizes with another campus route and a route that is not ACE enforced.",
  },
  {
    id: "q2-exempt-vehicles",
    title:
      "(2) Which vehicles repeatedly violate bus lane regulations despite being exempt from fines?",
    body:
      "Some vehicles stopped in violation are exempt from fines due to business reasons. For vehicles that are exempt, are there repeat offenders? Where are exempt vehicles frequently in violation?",
    recommendation:
      "Great for a mapping visualization. Choose a CUNY bus route you know and plot longitude/latitude of violations alongside the bus route.",
    embedUrl: "https://tan-karrie-52.tiiny.site/",
  },
  {
    id: "q3-cbd-congestion-pricing",
    title: "(3) How have violations changed with congestion pricing implementation?",
    body:
      "Some automated camera‑enforced routes travel within or cross Manhattan's Central Business District. How have violations on these routes changed alongside the implementation of congestion pricing?",
    recommendation:
      "Map CUNY bus routes through the CBD before and after congestion pricing to show change in bus speeds.",
  },
];

const insightsSolutions = [
  {
    id: "insight-q1",
    question:
      "Business Question 1: Which MTA bus routes are highly utilized by CUNY students, and how have ACE-enforced bus speeds changed?",
    actions: [
      "Expand ACE cameras to non-ACE, high-ridership CUNY routes (e.g., B6, Q27, M125).",
      "Add bus-priority infrastructure: dedicated lanes, transit signal priority, and all-door boarding.",
      "Regularly monitor & report bus speeds to evaluate ACE effectiveness and identify lagging routes.",
      "Engage CUNY students for feedback on problem intersections and bottlenecks.",
    ],
  },
  {
    id: "insight-q2",
    question: "Business Question 2: Which vehicles repeatedly violate ACE rules despite being exempt from fines?",
    actions: [
      "Partner with delivery companies (UPS, FedEx, Amazon, USPS) to reduce bus-lane misuse and expand legal loading zones.",
      "Review exemption rules (e.g., \"Commercial Under 20 min\") to prevent overuse or abuse.",
      "Focus targeted enforcement at violation hotspots (e.g., Midtown, Fordham Rd, 2nd Ave).",
      "Improve curbside management: more loading zones, off-hour delivery programs, and smart curb tech.",
      "Enhance ACE technology and analytics to flag chronic offenders and share data with NYPD or agencies.",
    ],
  },
  {
    id: "insight-q3",
    question: "Business Question 3: How have violations changed with congestion pricing, and how should MTA adapt?",
    actions: [
      "Expand ACE coverage across all major CBD bus corridors (34th St, 42nd St, 5th/Madison/Lexington).",
      "Revise curb regulations in CBD to align with bus lane needs (restrict loading during peak hours).",
      "Integrate congestion pricing cameras and data with ACE for stronger enforcement of repeat offenders.",
      "Continuously monitor bus speeds & violations; adjust CP tolling or enforcement if bus performance lags.",
      "Publicize bus speed gains post-congestion pricing to build support and encourage more riders.",
    ],
  },
];

const sources = [
  {
    title: "MTA Bus Automated Camera Enforcement Violations: Beginning October 2019",
    href: "https://data.ny.gov/Transportation/MTA-Bus-Automated-Camera-Enforcement-Violations-Be/kh8p-hcbm/about_data"
  },
  {
    title: "City University of New York (CUNY) University Campus Locations",
    href: "https://data.ny.gov/Education/City-University-of-New-York-CUNY-University-Campus/irqs-74ez/about_data"
  },
  {
    title: "MTA Bus Route Segment Speeds: 2023 - 2024",
    href: "https://data.ny.gov/Transportation/MTA-Bus-Route-Segment-Speeds-2023-2024/58t6-89vi/about_data"
  },
  {
    title: "MTA Bus Route Segment Speeds: Beginning 2025",
    href: "https://data.ny.gov/Transportation/MTA-Bus-Route-Segment-Speeds-Beginning-2025/kufs-yh3x/about_data"
  }
];

export default function PresentationPage() {
  const [q2EmbedHeight, setQ2EmbedHeight] = useState(640);
  const tocItems = useMemo<TocItem[]>(
    () => [
      ...sections.map((section) => ({ id: section.id, title: section.title })),
      { id: "insights-solutions", title: "Insights & Solutions" },
      { id: "sources", title: "Sources" },
    ],
    []
  );

  return (
    <Suspense>
      <main className="min-h-screen bg-background">
        <header className="relative overflow-hidden border-b border-border/60 bg-primary/5">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary animate-fade-up">
              Presentation
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl animate-fade-up animate-fade-up-delay-1">
              Business Questions To Answer
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-foreground/70 sm:text-base animate-fade-up animate-fade-up-delay-2">
              This page is structured for your talk. We'll drop in charts and maps later.
            </p>
            <div className="mt-6 rounded-2xl border border-primary/20 bg-card/70 p-4 shadow-soft-lg animate-fade-up animate-fade-up-delay-3">
              <nav aria-label="Table of contents" className="text-sm text-foreground/80">
                <ol className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {tocItems.map((item) => (
                    <li key={item.id} className="group">
                      <a
                        href={`#${item.id}`}
                        className="inline-flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span className="mr-2 text-primary">→</span>
                        <span className="line-clamp-2 text-left">{item.title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>
        </header>

        {/* Loom Video Embed */}
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
            <div style={{ position: "relative", paddingBottom: "57.446808510638306%", height: 0 }}>
              <iframe 
                src="https://www.loom.com/embed/7c07cc04d6b04a6683f35c2c97113b1e?sid=daf2fd5c-eafd-45e7-99b2-9bfe76bf8796" 
                frameBorder="0" 
                allowFullScreen 
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-[260px_1fr] sm:gap-8 sm:px-6 lg:py-14">
          <aside className="hidden sm:block">
            <div className="sticky top-20 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
                On this page
              </p>
              <ul className="space-y-2 text-sm">
                {tocItems.map((item, i) => (
                  <li key={item.id} className="animate-fade-up" style={{ animationDelay: `${0.05 * i}s` }}>
                    <a
                      href={`#${item.id}`}
                      className="block rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-foreground/80 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
                <li className="pt-2">
                  <a href="#top" className="text-xs text-primary hover:underline">
                    Back to top
                  </a>
                </li>
              </ul>
            </div>
          </aside>

          <section id="top" className="space-y-8">
            {sections.map((s, i) => {
              const embedUrl = s.embedUrl;
              const hasEmbed = Boolean(embedUrl);
              const isAdjustableEmbed = s.id === "q2-exempt-vehicles" && hasEmbed;
              const sliderId = `${s.id}-embed-height`;
              const isLastSection = i === sections.length - 1;
              const nextSectionId = isLastSection ? "insights-solutions" : sections[i + 1].id;
              const nextSectionLabel = isLastSection ? "Insights & Solutions →" : "Next section →";

              return (
                <article
                  key={s.id}
                  id={s.id}
                  className="scroll-mt-24 rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm sm:p-6 lg:p-8 surface-card animate-fade-up"
                  style={{ animationDelay: `${0.08 * i}s` }}
                  aria-labelledby={`${s.id}-title`}
                >
                  <header className="space-y-2">
                    <h2
                      id={`${s.id}-title`}
                      className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
                    >
                      {s.title}
                    </h2>
                    <p className="text-sm text-foreground/70">{s.body}</p>
                  </header>
                  {s.id === "q1-student-routes" ? (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                        <p className="text-sm text-foreground/80">
                          <strong>So yes — the data supports your conclusion:</strong> ACE enforcement has not delivered real speed gains on CUNY-serving routes.
                        </p>
                      </div>

                      <div className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
                          Explanations for Why ACE Hasn’t Boosted Speeds
                        </h3>
                        <ul className="list-disc space-y-2 pl-5 text-sm text-foreground/80">
                          <li>
                            <strong>Exempt vehicles still block lanes:</strong> Emergency services, Access-A-Ride vans, and delivery trucks (under exemptions) still frequently use bus lanes, negating ACE’s deterrent effect.
                          </li>
                          <li>
                            <strong>Curb management issues:</strong> Many campuses sit on streets with high demand for drop-offs/pick-ups (students, rideshares, deliveries). Even with cameras, buses get stuck behind legal or tolerated stops.
                          </li>
                          <li>
                            <strong>Limited ACE coverage:</strong> Not all segments of campus-serving routes are camera-monitored; violators shift behavior to nearby unmonitored blocks.
                          </li>
                          <li>
                            <strong>Structural congestion factors:</strong> Traffic signals, pedestrian volumes, double-parking, and construction often slow buses more than lane-blocking cars — problems ACE doesn’t address.
                          </li>
                          <li>
                            <strong>Low enforcement frequency per violator:</strong> Repeat offenders (especially fleets) are undeterred since ACE only issues one ticket per day per bus lane, leaving room for habitual violations.
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
                          Solutions to Address the Gap
                        </h3>
                        <ul className="list-disc space-y-2 pl-5 text-sm text-foreground/80">
                          <li>
                            <strong>Expand enforcement scope:</strong> Deploy cameras across <em>entire corridors</em> serving campuses, not just limited stretches, to reduce violator displacement.
                          </li>
                          <li>
                            <strong>Tackle exempt vehicles:</strong> Review exemption policies (e.g., “Commercial under 20 min”), introduce caps on repeat exempt stoppages, and work with delivery fleets to provide off-lane alternatives.
                          </li>
                          <li>
                            <strong>Curbside redesign near campuses:</strong> Create dedicated drop-off zones, loading bays, and paratransit areas so that essential stops happen without blockage.
                          </li>
                        </ul>
                      </div>

                      <div className="mt-2">
                        <CampusCharts />
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-4 rounded-xl border border-dashed border-border/60 bg-background/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">Recommendation</p>
                    <p className="mt-1 text-sm text-foreground/80">{s.recommendation}</p>
                  </div>

                  {embedUrl ? (
                    <div className="mt-6 space-y-4">
                      <FullscreenContainer className="rounded-2xl border border-border/60 bg-background/70 p-0" ariaLabel={`${s.title} visualization`}>
                        <div className="relative">
                          <iframe
                            src={embedUrl}
                            title={s.title}
                            className="w-full rounded-2xl"
                            style={{ height: isAdjustableEmbed ? q2EmbedHeight : 520 }}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                          />
                        </div>
                      </FullscreenContainer>
                      {isAdjustableEmbed ? (
                        <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <label
                            htmlFor={sliderId}
                            className="text-xs font-semibold uppercase tracking-widest text-foreground/60"
                          >
                            Adjust embed height
                          </label>
                          <div className="flex flex-1 items-center gap-3">
                            <input
                              id={sliderId}
                              type="range"
                              min={480}
                              max={960}
                              step={20}
                              value={q2EmbedHeight}
                              onChange={(event) => setQ2EmbedHeight(Number(event.target.value))}
                              className="flex-1"
                              aria-valuetext={`${q2EmbedHeight}px`}
                              aria-label="Adjust embedded visualization height"
                            />
                            <span className="text-xs text-foreground/60">{q2EmbedHeight}px</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {s.id === "q3-cbd-congestion-pricing" ? (
                    <div className="mt-6">
                      <CongestionPricingChart />
                    </div>
                  ) : null}

                  {s.id === "q2-exempt-vehicles" ? (
                    <div className="mt-6">
                      <ExemptVehiclesChart />
                    </div>
                  ) : null}

                  <div className="mt-6 flex items-center justify-between">
                    <a
                      href="#top"
                      className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      ↑ Back to top
                    </a>
                    <a
                      href={`#${nextSectionId}`}
                      className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      {nextSectionLabel}
                    </a>
                  </div>
                </article>
              );
            })}

            <article
              id="insights-solutions"
              className="scroll-mt-24 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6 lg:p-8 surface-card animate-fade-up"
              style={{ animationDelay: `${0.08 * sections.length}s` }}
              aria-labelledby="insights-solutions-title"
            >
              <header className="space-y-2">
                <h2
                  id="insights-solutions-title"
                  className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
                >
                  Insights & Solutions
                </h2>
                <p className="text-sm text-foreground/70">
                  Tie each question to a next step. These recommendations blend enforcement, curb management,
                  and rider engagement so the ACE program keeps speeding up student commutes.
                </p>
              </header>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {insightsSolutions.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-soft-lg animate-fade-up"
                    aria-labelledby={`${item.id}-question`}
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <h3
                      id={`${item.id}-question`}
                      className="text-sm font-semibold uppercase tracking-widest text-primary"
                    >
                      {item.question}
                    </h3>
                    <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-foreground/80">
                      {item.actions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>

            <article
              id="sources"
              className="scroll-mt-24 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6 lg:p-8 surface-card animate-fade-up"
              style={{ animationDelay: `${0.08 * (sections.length + 1)}s` }}
              aria-labelledby="sources-title"
            >
              <header className="space-y-2">
                <h2
                  id="sources-title"
                  className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
                >
                  Sources
                </h2>
                <p className="text-sm text-foreground/70">
                  Data sources used in this presentation from New York State Open Data.
                </p>
              </header>

              <div className="mt-6">
                <Sources>
                  <SourcesTrigger count={sources.length} />
                  <SourcesContent>
                    {sources.map((source) => (
                      <Source key={source.href} href={source.href} title={source.title} />
                    ))}
                  </SourcesContent>
                </Sources>
              </div>
            </article>
          </section>
        </div>
      </main>
    </Suspense>
  );
}
