"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type TickerCategory = "bus" | "train" | "car" | "alert";

type TickerItem = {
  symbol: string;
  emoji: string;
  label: string;
  value: string;
  changePct: number;
  category: TickerCategory;
  trend: "up" | "down" | "neutral";
};

const CATEGORY_STYLE: Record<
  TickerCategory,
  { chipBorder: string; symbolBg: string; symbolText: string; dotBg: string }
> = {
  bus: {
    chipBorder: "border-emerald-400/30",
    symbolBg: "bg-emerald-500/15",
    symbolText: "text-emerald-600",
    dotBg: "bg-emerald-500",
  },
  train: {
    chipBorder: "border-sky-400/30",
    symbolBg: "bg-sky-500/15",
    symbolText: "text-sky-600",
    dotBg: "bg-sky-500",
  },
  car: {
    chipBorder: "border-rose-400/30",
    symbolBg: "bg-rose-500/15",
    symbolText: "text-rose-600",
    dotBg: "bg-rose-500",
  },
  alert: {
    chipBorder: "border-amber-400/30",
    symbolBg: "bg-amber-500/15",
    symbolText: "text-amber-600",
    dotBg: "bg-amber-500",
  },
};

// Transit "stock market" - buses and trains UP is good, cars/violations DOWN is good!
const BASE_ITEMS: TickerItem[] = [
  { symbol: "M15-SBS", emoji: "🚌", label: "Bus speed rallying", value: "+7.2%", changePct: 7.2, category: "bus", trend: "up" },
  { symbol: "ACE-LINE", emoji: "🚂", label: "On-time performance", value: "94%", changePct: 5.1, category: "train", trend: "up" },
  { symbol: "VIOLATIONS", emoji: "🚗", label: "Traffic violations in correction", value: "-22%", changePct: -22, category: "car", trend: "down" },
  { symbol: "Q46", emoji: "🚌", label: "Speed gains sustained", value: "+5.1mph", changePct: 5.1, category: "bus", trend: "up" },
  { symbol: "BX12-SBS", emoji: "🚌", label: "Peak hour rally continues", value: "+12%", changePct: 12, category: "bus", trend: "up" },
  { symbol: "CBD-TRAFFIC", emoji: "🚗", label: "Congestion bearish (good!)", value: "-15%", changePct: -15, category: "car", trend: "down" },
  { symbol: "B44-SBS", emoji: "🚌", label: "Camera enforcement gains", value: "+8.4%", changePct: 8.4, category: "bus", trend: "up" },
  { symbol: "7-TRAIN", emoji: "🚂", label: "Express service bullish", value: "96%", changePct: 3.2, category: "train", trend: "up" },
  { symbol: "BUS-LANES", emoji: "🚌", label: "Clear lane index soaring", value: "89%", changePct: 15, category: "bus", trend: "up" },
  { symbol: "ILLEGAL-PARK", emoji: "🚗", label: "Bus blockers plummeting", value: "↓ 28%", changePct: -28, category: "car", trend: "down" },
  { symbol: "M15", emoji: "🚌", label: "Frequency at all-time high", value: "3.2min", changePct: 8, category: "bus", trend: "up" },
  { symbol: "DOT-SIGNALS", emoji: "🚦", label: "Smart signals trending up", value: "+11%", changePct: 11, category: "alert", trend: "up" },
  { symbol: "L-TRAIN", emoji: "🚂", label: "Reliability dividend", value: "98%", changePct: 4.5, category: "train", trend: "up" },
  { symbol: "GRIDLOCK", emoji: "🚗", label: "Gridlock in free fall (nice!)", value: "↓ 31%", changePct: -31, category: "car", trend: "down" },
  { symbol: "COMMUTE-TIME", emoji: "⏱️", label: "Travel time shorts winning", value: "-6min", changePct: -6, category: "bus", trend: "down" },
  { symbol: "BUS-MARKET", emoji: "📈", label: "Transit bulls crushing it", value: "BULLISH", changePct: 18, category: "bus", trend: "up" },
  { symbol: "TRANSIT-INDEX", emoji: "🎯", label: "NYC mobility score", value: "92/100", changePct: 9.2, category: "alert", trend: "up" },
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
        {/* Category legend - Transit Exchange */}
        <div className="hidden sm:flex flex-wrap items-center gap-3 py-1 text-[10px] text-foreground/70">
          <span className="font-semibold tracking-wide">NYC TRANSIT EXCHANGE</span>
          <span className="text-foreground/40">|</span>
          {legendCategories.map((cat) => {
            const style = CATEGORY_STYLE[cat];
            const label =
              cat === "bus"
                ? "🚌 Buses"
                : cat === "train"
                ? "🚂 Trains"
                : cat === "car"
                ? "🚗 Cars"
                : "🚦 DOT";
            return (
              <span key={cat} className="inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5">
                <span className={cn("size-2 rounded-full", style.dotBg)} />
                {label}
              </span>
            );
          })}
          <span className="text-foreground/40">|</span>
          <span className="text-emerald-600 font-medium">📈 BULLS: Faster Transit</span>
          <span className="text-rose-600 font-medium">📉 BEARS: Less Congestion</span>
        </div>

        <div className="flex animate-[ticker_30s_linear_infinite] gap-4 py-2">
          {list.map((it, idx) => {
            const style = CATEGORY_STYLE[it.category] ?? CATEGORY_STYLE.alert;
            const trendColor = it.trend === "up"
              ? "text-emerald-600"
              : it.trend === "down"
              ? "text-rose-600"
              : "text-foreground/70";
            const trendArrow = it.trend === "up" ? "↑" : it.trend === "down" ? "↓" : "→";

            return (
              <div
                key={`${it.symbol}-${idx}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border bg-background/70 px-2.5 py-1 text-xs shadow-sm whitespace-nowrap",
                  style.chipBorder
                )}
              >
                <span className="text-base">{it.emoji}</span>
                <span className={cn("rounded-md px-1.5 py-0.5 font-bold tracking-tight", style.symbolBg, style.symbolText)}>
                  {it.symbol}
                </span>
                <span className="text-foreground/70">{it.label}</span>
                <span className={cn("font-bold flex items-center gap-1", trendColor)}>
                  <span className="text-sm">{trendArrow}</span>
                  {it.value}
                </span>
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
