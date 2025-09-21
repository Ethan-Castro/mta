"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRightIcon, LayoutDashboardIcon } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

type GlobalRoute =
  | "/"
  | "/executive"
  | "/operations"
  | "/students"
  | "/policy"
  | "/data-science"
  | "/chat";

const NAV_ITEMS: Array<{ href: GlobalRoute; label: string }> = [
  { href: "/", label: "Overview" },
  { href: "/executive", label: "Executive" },
  { href: "/operations", label: "Operations" },
  { href: "/students", label: "CUNY Students" },
  { href: "/policy", label: "Policy" },
  { href: "/data-science", label: "Data Science" },
  { href: "/chat", label: "ACE Copilot" },
];

export default function GlobalHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LayoutDashboardIcon className="size-4" aria-hidden="true" />
          </div>
          <div>
            <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
              ACE Insight Studio
            </Link>
            <p className="text-xs text-foreground/60">
              Executive-ready analytics for ACE enforcement, congestion pricing, and CUNY mobility
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/chat"
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/15"
          >
            Launch Copilot
            <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <nav className="border-t border-border/40 bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 sm:px-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative my-2 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
