"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type TickerCategory = "violations" | "exemptions" | "speed" | "campuses" | "other";

type TickerItem = {
  symbol: string;
  label: string;
  value: number;
  changePct: number;
  category: TickerCategory;
};

const CATEGORY_STYLE: Record<
  TickerCategory,
  { chipBorder: string; symbolBg: string; symbolText: string; dotBg: string }
> = {
  violations: {
    chipBorder: "border-rose-400/30",
    symbolBg: "bg-rose-500/15",
    symbolText: "text-rose-600",
    dotBg: "bg-rose-500",
  },
  exemptions: {
    chipBorder: "border-emerald-400/30",
    symbolBg: "bg-emerald-500/15",
    symbolText: "text-emerald-600",
    dotBg: "bg-emerald-500",
  },
  speed: {
    chipBorder: "border-sky-400/30",
    symbolBg: "bg-sky-500/15",
    symbolText: "text-sky-600",
    dotBg: "bg-sky-500",
  },
  campuses: {
    chipBorder: "border-violet-400/30",
    symbolBg: "bg-violet-500/15",
    symbolText: "text-violet-600",
    dotBg: "bg-violet-500",
  },
  other: {
    chipBorder: "border-zinc-400/30",
    symbolBg: "bg-zinc-500/15",
    symbolText: "text-zinc-700",
    dotBg: "bg-zinc-500",
  },
};

// Seeded with provided ACE metrics
const BASE_ITEMS: TickerItem[] = [
  { symbol: "VIOL-ISSUED", label: "Violation issued", value: 2_312_878, changePct: 0, category: "violations" },
  { symbol: "TECH", label: "Technical issue/other", value: 320_912, changePct: 0, category: "violations" },
  { symbol: "EX-EMERG", label: "Exempt - emergency vehicle", value: 286_253, changePct: 0, category: "exemptions" },
  { symbol: "MISSING", label: "Driver/vehicle info missing", value: 273_968, changePct: 0, category: "violations" },
  { symbol: "EX-COMM20", label: "Exempt - commercial under 20", value: 257_374, changePct: 0, category: "exemptions" },
  { symbol: "EX-BUS", label: "Exempt - bus/paratransit", value: 190_192, changePct: 0, category: "exemptions" },
  { symbol: "EX-OTHER", label: "Exempt - other", value: 136_991, changePct: 0, category: "exemptions" },
  { symbol: "VIOLATIONS", label: "Total violations", value: 3_778_568, changePct: 0, category: "violations" },
  { symbol: "CAMPUSES", label: "Campuses", value: 26, changePct: 0, category: "campuses" },
];

function formatValue(n: number) {
  if (Number.isInteger(n)) return Intl.NumberFormat().format(n);
  if (Math.abs(n) >= 1000) return Intl.NumberFormat().format(Math.round(n));
  return n.toFixed(1);
}

export default function MarketTickerBar() {
  const [items, setItems] = useState<TickerItem[]>(BASE_ITEMS);
  const timerRef = useRef<number | null>(null);
  const [stickyTop, setStickyTop] = useState<number>(0);

  // Keep ticker static for now since these are summary counts
  useEffect(() => {
    // Measure header height to align ticker directly beneath it across breakpoints
    const measure = () => {
      const header = document.querySelector("header");
      const height = header ? Math.ceil((header as HTMLElement).getBoundingClientRect().height) : 0;
      setStickyTop(height);
    };
    measure();
    window.addEventListener("resize", measure);
    const id = window.setInterval(measure, 1000); // re-check occasionally for dynamic content
    return () => {
      window.removeEventListener("resize", measure);
      window.clearInterval(id);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const list = useMemo(() => [...items, ...items], [items]);
  const legendCategories = useMemo(() => {
    const set = new Set<TickerCategory>();
    items.forEach((it) => set.add(it.category));
    return Array.from(set);
  }, [items]);

  return (
    <div
      className="sticky z-20 border-b border-border/60 bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{ top: stickyTop }}
    >
      <div className="w-full overflow-hidden px-4 sm:px-6">
        {/* Category legend */}
        <div className="hidden sm:flex flex-wrap items-center gap-3 py-1 text-[10px] text-foreground/70">
          {legendCategories.map((cat) => {
            const style = CATEGORY_STYLE[cat];
            const label =
              cat === "violations"
                ? "Violations"
                : cat === "exemptions"
                ? "Exemptions"
                : cat === "speed"
                ? "Speed"
                : cat === "campuses"
                ? "Campuses"
                : "Other";
            return (
              <span key={cat} className="inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5">
                <span className={cn("size-2 rounded-full", style.dotBg)} />
                {label}
              </span>
            );
          })}
        </div>

        <div className="flex animate-[ticker_30s_linear_infinite] gap-4 py-2">
          {list.map((it, idx) => {
            const style = CATEGORY_STYLE[it.category] ?? CATEGORY_STYLE.other;
            return (
              <div
                key={`${it.symbol}-${idx}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border bg-background/70 px-2.5 py-1 text-xs shadow-sm",
                  style.chipBorder
                )}
              >
                <span className={cn("rounded-md px-1.5 py-0.5 font-semibold", style.symbolBg, style.symbolText)}>
                  {it.symbol}
                </span>
                <span className="text-foreground/70">{it.label}</span>
                <span className="font-semibold text-foreground">{formatValue(it.value)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}
