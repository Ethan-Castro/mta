"use client";

import { Suspense } from "react";
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
    title: "Question 1 · Which MTA bus routes are highly utilized by CUNY students?",
    body:
      "Compare ACE-enforced corridors with the bus lines CUNY students rely on to show where camera enforcement is delivering results and where speeds still lag.",
    recommendation:
      "Pair an ACE route with a similar non-ACE peer and quantify the travel-speed gap on one slide.",
  },
  {
    id: "q2-exempt-vehicles",
    title:
      "Question 2 · Which vehicles repeatedly violate bus lane regulations despite being exempt from fines?",
    body:
      "Focus on the fleets and exemption types that keep resurfacing in violation data so you can show why curb management must evolve alongside ACE cameras.",
    recommendation:
      "Map one campus route and spotlight the top three exemption types driving repeat blockages.",
    embedUrl: "https://tan-karrie-52.tiiny.site/",
  },
  {
    id: "q3-cbd-congestion-pricing",
    title: "Question 3 · How have violations changed with congestion pricing implementation?",
    body:
      "Spell out what changed on CBD routes once tolling went live so stakeholders can see whether congestion pricing and ACE reinforce one another.",
    recommendation:
      "Show a before-and-after trend for one CBD route and note if enforcement or operations should pivot.",
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

const tocItems: TocItem[] = [
  ...sections.map((section) => ({ id: section.id, title: section.title })),
  { id: "insights-solutions", title: "Insights & Solutions" },
  { id: "sources", title: "Sources" },
];

const EMBED_HEIGHT = 560;

export default function PresentationPage() {
  return (
    <Suspense>
      <main className="min-h-screen bg-background">
        <header className="relative overflow-hidden border-b border-border/60 bg-primary/5">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Presentation</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Presentation Outline
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-foreground/70 sm:text-base">
              Use this outline to guide the story. Drop in your visuals as they are ready and keep the focus on the why.
            </p>
            <nav aria-label="Presentation outline" className="mt-6 text-sm text-foreground/80">
              <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block rounded-xl border border-border/60 bg-background/70 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
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
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground"
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
              const isLastSection = i === sections.length - 1;
              const nextSectionId = isLastSection ? "insights-solutions" : sections[i + 1].id;
              const nextSectionLabel = isLastSection ? "Insights & Solutions" : "Next section";

              return (
                <article
                  key={s.id}
                  id={s.id}
                  className="scroll-mt-24 rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm sm:p-6 lg:p-8"
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
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                          <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
                            Why speeds stalled
                          </h3>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-foreground/80">
                            <li>
                              <strong>Exempt fleets linger:</strong> Delivery, paratransit, and emergency vehicles still sit in bus lanes.
                            </li>
                            <li>
                              <strong>Campus curb pressure:</strong> Pickups at campus gates slow buses even when stops are legal.
                            </li>
                            <li>
                              <strong>Patchy coverage:</strong> Violators shift to blocks where ACE cameras are not installed.
                            </li>
                          </ul>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                          <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
                            How to frame it
                          </h3>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-foreground/80">
                            <li>Compare one ACE corridor with a similar non-ACE campus route.</li>
                            <li>Call out travel-time changes before and after ACE enforcement.</li>
                            <li>Highlight the student groups and campuses most affected.</li>
                          </ul>
                        </div>
                      </div>

                      <div className="mt-2">
                        <CampusCharts />
                      </div>
                    </div>
                  ) : null}
                  {s.id === "q2-exempt-vehicles" ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
                          Why exemptions matter
                        </h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-foreground/80">
                          <li>Repeat fleets show up week after week with the same exemption codes.</li>
                          <li>Short-stop rules keep trucks in lanes during the busiest class hours.</li>
                          <li>Hotspots cluster around campus loading and delivery zones.</li>
                        </ul>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
                          Slide tips
                        </h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-foreground/80">
                          <li>Lead with a ranked list of exemption types by violation count.</li>
                          <li>Circle two to three intersections that need new curb pilots.</li>
                          <li>Note the partners (NYCDOT, delivery firms) you need at the table.</li>
                        </ul>
                      </div>
                    </div>
                  ) : null}
                  {s.id === "q3-cbd-congestion-pricing" ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
                          Signals in the data
                        </h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-foreground/80">
                          <li>CBD routes with toll coverage saw the sharpest drop in violations.</li>
                          <li>Non-CBD ACE corridors barely moved, underscoring the pricing effect.</li>
                          <li>Speeds improved fastest on campus-serving lines with overlapping policies.</li>
                        </ul>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
                          What to say next
                        </h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-foreground/80">
                          <li>Show a simple before/after chart for one CBD route that students use.</li>
                          <li>Explain whether enforcement needs to follow riders into side streets.</li>
                          <li>Flag the metric you'll monitor monthly to keep momentum.</li>
                        </ul>
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
                            style={{ height: EMBED_HEIGHT }}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                          />
                        </div>
                      </FullscreenContainer>
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
                      Back to top
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
              className="scroll-mt-24 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6 lg:p-8"
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
                  Tie each question to a specific next step. These moves align enforcement, curb management,
                  and rider engagement so ACE keeps student commutes moving.
                </p>
              </header>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {insightsSolutions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-soft-lg"
                    aria-labelledby={`${item.id}-question`}
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
              className="scroll-mt-24 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6 lg:p-8"
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
                  Data powering this presentation, sourced from New York State Open Data.
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
