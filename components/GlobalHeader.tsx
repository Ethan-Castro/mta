"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRightIcon, LayoutDashboardIcon, LogInIcon, LogOutIcon, UserIcon, UserPlusIcon } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useUser } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";

type GlobalRoute =
  | "/"
  | "/executive"
  | "/operations"
  | "/map"
  | "/students"
  | "/policy"
  | "/data-science"
  | "/chat";

const NAV_ITEMS: Array<{ href: GlobalRoute; label: string }> = [
  { href: "/", label: "Overview" },
  { href: "/executive", label: "Executive" },
  { href: "/operations", label: "Operations" },
  { href: "/map", label: "Map Explorer" },
  { href: "/students", label: "CUNY Students" },
  { href: "/policy", label: "Policy" },
  { href: "/data-science", label: "Data Science" },
  { href: "/chat", label: "ACE Copilot" },
];

export default function GlobalHeader() {
  const pathname = usePathname();
  const user = useUser();

  const accountUrl = user?.urls?.accountSettings ?? stackClientApp.urls.accountSettings;
  const signOutUrl = user?.urls?.signOut ?? stackClientApp.urls.signOut;
  const signInUrl = stackClientApp.urls.signIn;
  const signUpUrl = stackClientApp.urls.signUp;

  const userLabel = useMemo(() => {
    if (!user) return null;
    if (user.displayName) return user.displayName;
    if (user.primaryEmail) return user.primaryEmail;
    return "Account";
  }, [user]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-9">
            <LayoutDashboardIcon className="size-3.5 sm:size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
              ACE Insight Studio
            </Link>
            <p className="hidden text-xs text-foreground/60 sm:block">
              Executive-ready analytics for ACE enforcement, congestion pricing, and CUNY mobility
            </p>
            <p className="text-xs text-foreground/60 sm:hidden">
              ACE analytics dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                href={accountUrl}
                className="inline-flex items-center gap-1 rounded-full border border-foreground/20 px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition-all hover:border-foreground/50 hover:text-foreground sm:px-3"
              >
                <UserIcon className="size-4" aria-hidden="true" />
                <span className="max-w-[10ch] truncate sm:max-w-[14ch]">{userLabel}</span>
              </Link>
              <Link
                href={signOutUrl}
                aria-label="Sign out"
                title="Sign out"
                className="inline-flex items-center justify-center rounded-full border border-foreground/20 p-1.5 text-foreground/70 transition-all hover:border-foreground/40 hover:text-foreground sm:p-2"
              >
                <LogOutIcon className="size-4" aria-hidden="true" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href={signInUrl}
                aria-label="Sign in"
                title="Sign in"
                className="inline-flex items-center justify-center rounded-full border border-foreground/20 p-1.5 text-foreground/70 transition-all hover:border-foreground/40 hover:text-foreground sm:p-2"
              >
                <LogInIcon className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href={signUpUrl}
                aria-label="Sign up"
                title="Sign up"
                className="inline-flex items-center justify-center rounded-full border border-foreground/20 p-1.5 text-foreground/70 transition-all hover:border-foreground/40 hover:text-foreground sm:p-2"
              >
                <UserPlusIcon className="size-4" aria-hidden="true" />
              </Link>
            </>
          )}
          <ThemeToggle />
          <Link
            href="/chat"
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md sm:px-3"
          >
            <span className="hidden sm:inline">Open ACE Copilot</span>
            <span className="sm:hidden">Open Copilot</span>
            <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <nav className="border-t border-border/40 bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 sm:gap-2 sm:px-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative my-2 inline-flex items-center rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap sm:px-3 ${
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
