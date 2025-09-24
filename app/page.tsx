// Using anchor tags to avoid dependency on next/link types in this scaffold
import SpeedCard from "@/components/SpeedCard";
import ViolationsCard from "@/components/ViolationsCard";
import RouteAnalysisCard from "@/components/RouteAnalysisCard";
import { Suspense } from "react";

const personas = [
  {
    href: "/executive",
    title: "Executive",
    subtitle: "KPIs and narrative insights",
    description:
      "Summaries, benchmarks, and talking points for C-suite and board updates.",
  },
  {
    href: "/operations",
    title: "Operations",
    subtitle: "Route speeds and violations",
    description:
      "Compare ACE vs non-ACE corridors, flag repeat exempt fleets, and stage field deployments.",
  },
  {
    href: "/students",
    title: "CUNY Students",
    subtitle: "Commute stories & hotspots",
    description:
      "Zoom in on campus riders, travel timelines, and the curb issues they experience daily.",
  },
  {
    href: "/policy",
    title: "Policy",
    subtitle: "CBD & ACE impact",
    description:
      "Track congestion pricing effects, ACE expansion targets, and documentation for rapid briefs.",
  },
  {
    href: "/data-science",
    title: "Data Science",
    subtitle: "Predictions & simulations",
    description:
      "Wire SQL, Python, and visualization tools for forecasting and scenario planning.",
  },
  {
    href: "/chat",
    title: "ACE Copilot",
    subtitle: "AI assistant",
    description:
      "Ask for SQL, code, or visuals. Prompts now, live Neon Postgres queries soon.",
  },
];

const businessQuestions = [
  {
    title: "Q1 · Student-heavy routes",
    detail:
      "Identify high-utilization CUNY corridors, compare ACE vs non-ACE speed changes, and recommend reliability fixes.",
  },
  {
    title: "Q2 · Exempt vehicles",
    detail:
      "Track repeat exempt fleets, map hotspots, and coordinate with field teams to keep bus lanes and stops clear.",
  },
  {
    title: "Q3 · CBD performance",
    detail:
      "Benchmark violations and speeds on CBD routes before/after congestion pricing to guide policy moves.",
  },
];

const featureHighlights = [
  {
    heading: "Curated analytics",
    copy: "Pre-built KPIs, narratives, and filters align directly to the datathon rubric and stakeholder needs.",
  },
  {
    heading: "Spatial intelligence",
    copy: "Interactive Mapbox views blend ACE violations, CUNY campuses, and CBD corridors for quick situational awareness.",
  },
  {
    heading: "AI copilots",
    copy: "The ACE assistant drafts SQL, code, and executive write-ups—ready to plug into Neon Postgres for live data.",
  },
  {
    heading: "ML-ready pipelines",
    copy: "Simulation stubs, prompt libraries, and SQL recipes shorten the path to forecasting ticket counts and rider impacts.",
  },
];

const readinessChecklist = [
  "Neon Postgres connection plan for ACE violations, AVL speeds, and CUNY enrollment",
  "SQL recipes for campus exposure, repeat exempt fleets, and ACE go-live timelines",
  "Python tooling paths for Monte Carlo and causal inference",
  "Map-friendly GeoJSON structure for hotspot overlays",
  "Documentation hubs for ACE program, DOT curb rules, and congestion pricing",
];

export default function Home() {
  return (
    <Suspense>
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:gap-16 sm:px-6 sm:py-12 lg:gap-20 lg:py-16">
          <header className="space-y-4 rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-sm sm:space-y-6 sm:p-8">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">MTA Datathon 2025</p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                ACE Insight Studio for Executives, Analysts, and Campus Advocates
              </h1>
              <p className="max-w-2xl text-sm text-foreground/70 sm:text-base">
                One place to monitor ACE performance, explain changes, and brief leadership with confidence.
              </p>
            </div>
            <div className="grid gap-3 text-xs text-foreground/70 sm:grid-cols-3 sm:text-sm">
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <p className="font-semibold text-primary">Q1 · Student routes</p>
                <p className="mt-1 text-primary/80">Compare ACE vs non-ACE speed gains, highlight campus commute wins, and propose targeted expansions.</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <p className="font-semibold text-primary">Q2 · Exempt fleets</p>
                <p className="mt-1 text-primary/80">Detect repeat exempt violators, map hotspots, and align enforcement with DOT curb strategy.</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <p className="font-semibold text-primary">Q3 · CBD lens</p>
                <p className="mt-1 text-primary/80">Quantify congestion pricing impacts on ACE corridors and prepare policy-ready reporting.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center">
              <a
                href="/chat"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg"
              >
                Open ACE Copilot
              </a>
              <a
                href="/executive"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/30 bg-transparent px-4 py-2 text-sm font-medium text-foreground/80 transition-all hover:border-foreground/50 hover:text-foreground"
              >
                Explore dashboards
              </a>
            </div>
          </header>

          <section aria-labelledby="personas" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="personas" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Workspace navigation</h2>
                <p className="text-sm text-foreground/70">Each view is tuned to a stakeholder persona and datathon deliverable.</p>
              </div>
              <p className="text-xs text-foreground/50">Tip: bookmark the views your teammates use most.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {personas.map((persona) => (
                <a
                  key={persona.href}
                  href={persona.href}
                  className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg sm:p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-foreground sm:text-lg">{persona.title}</h3>
                      <p className="text-xs uppercase tracking-wide text-primary/80">{persona.subtitle}</p>
                    </div>
                    <span className="text-primary transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </div>
                  <p className="mt-3 text-sm text-foreground/70">{persona.description}</p>
                </a>
              ))}
            </div>
          </section>

          <section aria-labelledby="questions" className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 id="questions" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Business questions in scope</h2>
              <p className="text-sm text-foreground/70">Use the workspace tabs or the ACE copilot prompts to dive deeper.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {businessQuestions.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-foreground/70">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="features" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="features" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Why this studio stands out</h2>
                <p className="text-sm text-foreground/70">More than static charts—this is a launchpad for decision-ready insights.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {featureHighlights.map((feature) => (
                <div key={feature.heading} className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5">
                  <h3 className="text-base font-semibold text-foreground">{feature.heading}</h3>
                  <p className="mt-2 text-sm text-foreground/70">{feature.copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="predictions" className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 id="predictions" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Live predictions</h2>
              <p className="text-sm text-foreground/70">Try speed, violations, and route analysis models with adjustable inputs.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SpeedCard />
              <ViolationsCard />
              <RouteAnalysisCard />
            </div>
          </section>

          <section aria-labelledby="copilot" className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 id="copilot" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">ACE Copilot: your always-on analyst</h2>
              <p className="text-sm text-foreground/70">Connect prompts with live data, SQL, and Python (Neon Postgres ready).</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-foreground">Natural-language questions</h3>
                <p className="mt-2 text-sm text-foreground/70">"Compare M15-SBS vs Q46 this semester with charts" or "Draft a board-ready CBD summary."</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-foreground">Tool orchestration</h3>
                <p className="mt-2 text-sm text-foreground/70">Future integration includes SQL, Python, and viz helpers registered with the AI SDK.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-foreground">Shareable outputs</h3>
                <p className="mt-2 text-sm text-foreground/70">Use the chat transcript or generated markdown to brief executives and field teams quickly.</p>
              </div>
            </div>
            <a
              href="/chat"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg"
            >
              Open ACE Copilot →
            </a>
          </section>

          <section aria-labelledby="readiness" className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 id="readiness" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Data & ML readiness checklist</h2>
              <p className="text-sm text-foreground/70">This project is built to plug into your Neon Postgres environment with minimal rework.</p>
            </div>
            <div className="rounded-3xl border border-border/60 bg-background/90 p-4 sm:p-6">
              <ul className="grid gap-3 text-sm text-foreground/80 sm:grid-cols-2">
                {readinessChecklist.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex size-2 rounded-full bg-primary" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="next-steps" className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 id="next-steps" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">What to do next</h2>
              <p className="text-sm text-foreground/70">Coordinate with your team to finish the datathon submission with confidence.</p>
            </div>
            <ol className="grid gap-4 text-sm text-foreground/80 sm:grid-cols-2">
              <li className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">Step 1</span>
                <h3 className="mt-2 text-base font-semibold text-foreground">Sync on campus priorities</h3>
                <p className="mt-1">Use the Students and Operations views to align on which routes need the deepest dive.</p>
              </li>
              <li className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">Step 2</span>
                <h3 className="mt-2 text-base font-semibold text-foreground">Wire live data</h3>
                <p className="mt-1">Connect Neon Postgres and run the provided SQL recipes to feed real-time dashboards.</p>
              </li>
              <li className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">Step 3</span>
                <h3 className="mt-2 text-base font-semibold text-foreground">Leverage the copilot</h3>
                <p className="mt-1">Prompt the ACE assistant for writeups, visualizations, and simulation scripts.</p>
              </li>
              <li className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">Step 4</span>
                <h3 className="mt-2 text-base font-semibold text-foreground">Package the story</h3>
                <p className="mt-1">Use the Executive and Policy briefs to finalize decks, memos, and final judging submissions.</p>
              </li>
            </ol>
          </section>
        </div>
      </main>
    </Suspense>
  );
}
