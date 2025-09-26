import Link from "next/link";
import {
  ArrowUpRightIcon,
  BarChart3Icon,
  MapIcon,
  MessageSquareIcon,
  UsersIcon,
} from "lucide-react";

const quickLinks = [
  {
    href: "/presentation",
    title: "Presentation",
    description: "Walk through the three core questions with prepared talking points and placeholders for charts.",
    icon: BarChart3Icon,
  },
  {
    href: "/executive",
    title: "Executive",
    description: "Get top-line metrics, curated insights, and AI-assisted summaries for leadership briefings.",
    icon: UsersIcon,
  },
  {
    href: "/operations",
    title: "Operations",
    description: "Drill into route performance, exemption trends, and violation hotspots for day-to-day decisions.",
    icon: MapIcon,
  },
  {
    href: "/chat",
    title: "ACE Copilot",
    description: "Ask questions in plain language and pull curated responses backed by the ACE data platform.",
    icon: MessageSquareIcon,
  },
];

export default function OverviewPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-12 sm:px-6">
      <section className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Welcome to the ACE Insight Studio
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-foreground/70 sm:text-base">
          Use this workspace to track congestion pricing, ACE enforcement, and student mobility in one view.
          Start here when you need the latest storyline, supporting visuals, or a quick answer for leadership.
        </p>
        <ul className="mt-5 grid gap-3 text-sm text-foreground/80 sm:grid-cols-2">
          <li className="rounded-2xl border border-primary/20 bg-background/70 px-4 py-3">
            Track how ACE-enforced corridors compare with the student-heavy routes you oversee.
          </li>
          <li className="rounded-2xl border border-primary/20 bg-background/70 px-4 py-3">
            Surface repeat exempt vehicles and curb pressure zones before they slow buses.
          </li>
          <li className="rounded-2xl border border-primary/20 bg-background/70 px-4 py-3">
            Connect congestion pricing trends to campus travel times and reliability targets.
          </li>
          <li className="rounded-2xl border border-primary/20 bg-background/70 px-4 py-3">
            Share concise recommendations with executives, operators, and policy partners.
          </li>
        </ul>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Jump to what you need
            </h2>
            <p className="mt-1 text-sm text-foreground/70">
              These quick links respect any filters you set, so you can pivot between views without losing context.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex h-full flex-col justify-between rounded-2xl border border-border/60 bg-background/70 p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex rounded-full bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{link.title}</h3>
                    <p className="mt-1 text-sm text-foreground/70">{link.description}</p>
                  </div>
                </div>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors group-hover:text-primary/80">
                  Open view
                  <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">How to use this workspace</h2>
        <ol className="mt-4 space-y-3 text-sm text-foreground/80 sm:text-base">
          <li className="rounded-xl border border-border/60 bg-background/70 px-4 py-3">
            Start on the Presentation page before briefings so the narrative stays aligned across teams.
          </li>
          <li className="rounded-xl border border-border/60 bg-background/70 px-4 py-3">
            Use the Executive or Operations tabs for supporting metrics, then carry highlights into your decks.
          </li>
          <li className="rounded-xl border border-border/60 bg-background/70 px-4 py-3">
            When new questions land, head to ACE Copilot to generate a quick response backed by the data.
          </li>
        </ol>
      </section>
    </div>
  );
}
