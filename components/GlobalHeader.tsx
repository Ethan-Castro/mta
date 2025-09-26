"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRightIcon, LayoutDashboardIcon, LogInIcon, LogOutIcon, UserIcon, UserPlusIcon, ChevronDownIcon, BarChart3Icon, MapIcon, UsersIcon, FileTextIcon, BrainIcon, MessageSquareIcon, ClockIcon } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useUser } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type GlobalRoute =
  | "/"
  | "/presentation"
  | "/executive"
  | "/operations"
  | "/map"
  | "/students"
  | "/policy"
  | "/data-science"
  | "/chat";

// Primary navigation items (always visible)
const PRIMARY_NAV_ITEMS: Array<{ href: GlobalRoute; label: string; icon?: React.ComponentType<any> }> = [
  { href: "/", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/executive", label: "Executive", icon: BarChart3Icon },
  { href: "/operations", label: "Operations", icon: BarChart3Icon },
];

// Secondary navigation items (in dropdown)
const SECONDARY_NAV_ITEMS: Array<{ href: GlobalRoute | "/real-time"; label: string; icon?: React.ComponentType<any> }> = [
  { href: "/presentation", label: "Presentation", icon: FileTextIcon },
  { href: "/map", label: "Map Explorer", icon: MapIcon },
  { href: "/students", label: "CUNY Students", icon: UsersIcon },
  { href: "/policy", label: "Policy", icon: FileTextIcon },
  { href: "/data-science", label: "Data Science", icon: BrainIcon },
  { href: "/real-time", label: "Real-time", icon: ClockIcon },
];

export default function GlobalHeader() {
  const pathname = usePathname();
  const user = useUser();

  const accountUrl = stackClientApp.urls.accountSettings;
  const signOutUrl = stackClientApp.urls.signOut;
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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-10">
            <LayoutDashboardIcon className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex items-baseline gap-2">
            <Link href="/" className="text-sm font-semibold tracking-tight text-foreground whitespace-nowrap">
              ACE Insight Studio
            </Link>
            <span className="hidden sm:inline text-xs text-foreground/60 truncate max-w-[40ch]">
              — The most trusted place to analyze ACE policy and mobility trends
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden md:flex items-center gap-1">
            {/* Primary navigation items */}
            {PRIMARY_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive ? "text-primary" : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {Icon && <Icon className="size-3.5" />}
                  <span className="relative z-10">{item.label}</span>
                  <span
                    aria-hidden
                    className={`absolute inset-0 -z-0 rounded-full transition-opacity ${
                      isActive ? "bg-primary/10 opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:bg-foreground/5"
                    }`}
                  />
                </Link>
              );
            })}
            
            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="group relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors text-foreground/70 hover:text-foreground">
                <span className="relative z-10">More</span>
                <ChevronDownIcon className="size-3.5" />
                <span
                  aria-hidden
                  className="absolute inset-0 -z-0 rounded-full transition-opacity opacity-0 group-hover:opacity-100 group-hover:bg-foreground/5"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Additional Views</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SECONDARY_NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2 ${isActive ? "bg-primary/10 text-primary" : ""}`}
                      >
                        {Icon && <Icon className="size-4" />}
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
          {user ? (
            <>
              <a
                href={accountUrl}
                className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-background/80 px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition-all hover:border-foreground/40 hover:text-foreground sm:px-3"
              >
                <UserIcon className="size-4" aria-hidden="true" />
                <span className="max-w-[10ch] truncate sm:max-w-[14ch]">{userLabel}</span>
              </a>
              <a
                href={signOutUrl}
                aria-label="Sign out"
                title="Sign out"
                className="inline-flex items-center justify-center rounded-full border border-foreground/15 bg-background/80 p-1.5 text-foreground/70 transition-all hover:border-foreground/40 hover:text-foreground sm:p-2"
              >
                <LogOutIcon className="size-4" aria-hidden="true" />
              </a>
            </>
          ) : (
            <>
              <a
                href={signInUrl}
                className="hidden items-center gap-1 rounded-full border border-foreground/15 bg-background/80 px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition-all hover:border-foreground/40 hover:text-foreground sm:inline-flex"
              >
                <LogInIcon className="size-4" aria-hidden="true" />
                Sign in
              </a>
              <a
                href={signUpUrl}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
              >
                <UserPlusIcon className="size-4" aria-hidden="true" />
                Get started
              </a>
            </>
          )}
          <ThemeToggle />
          <Link
            href="/chat"
            className="hidden sm:inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/15"
          >
            <MessageSquareIcon className="size-3.5" />
            <span>Copilot</span>
            <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <nav className="md:hidden border-t border-border/40 bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 sm:gap-2 sm:px-6">
          {[...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS].map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative my-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap sm:px-3 ${
                  isActive ? "bg-primary/15 text-primary" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {Icon && <Icon className="size-3.5" />}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
