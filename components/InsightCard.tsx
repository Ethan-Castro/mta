import type { ReactNode } from "react";

type Props = {
  title: string;
  value: string;
  subline?: string;
  trendLabel?: string;
  trendDelta?: string;
  trendPositive?: boolean;
  footer?: ReactNode;
  align?: "start" | "center";
};

export default function InsightCard({
  title,
  value,
  subline,
  trendLabel,
  trendDelta,
  trendPositive,
  footer,
  align = "start",
}: Props) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";
  const textAlignment = align === "center" ? "text-center" : "text-left";
  const trendColor = trendPositive ? "text-[color:var(--chart-3)]" : "text-[color:var(--chart-6)]";
  return (
    <div className="surface-card group animate-fade-up rounded-xl border border-foreground/10 bg-background/80 p-4 transition-colors duration-500 focus-within:ring-1 focus-within:ring-primary/40 sm:p-5">
      <span className="pointer-events-none absolute inset-px rounded-[inherit] bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden />
      <div className={`relative z-10 flex flex-col gap-2 ${alignment}`}>
        <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground/60">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary/60 shadow-[0_0_0_4px_rgba(8,23,156,0.08)] transition-transform duration-500 group-hover:scale-125" aria-hidden />
          {title}
        </div>
        <div className={`animate-fade-up text-xl font-semibold leading-tight sm:text-2xl ${textAlignment}`}>
          {value}
        </div>
        {subline && <div className={`text-sm text-foreground/70 transition-colors duration-500 ${textAlignment}`}>{subline}</div>}
        {trendLabel && trendDelta && (
          <div className={`text-xs font-semibold tracking-wide ${trendColor}`}>
            {trendLabel}: {trendDelta}
          </div>
        )}
        {footer && <div className="mt-1 w-full border-t border-foreground/10 pt-2 text-xs text-foreground/60">{footer}</div>}
      </div>
    </div>
  );
}
