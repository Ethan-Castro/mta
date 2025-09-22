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
  return (
    <div className="rounded-lg border border-foreground/10 bg-background/70 p-4 space-y-2 sm:p-5">
      <div className="text-xs uppercase tracking-wide text-foreground/60">{title}</div>
      <div className={`text-xl font-semibold leading-tight sm:text-2xl ${align === "center" ? "text-center" : "text-left"}`}>
        {value}
      </div>
      {subline && <div className={`text-sm text-foreground/70 ${align === "center" ? "text-center" : "text-left"}`}>{subline}</div>}
      {trendLabel && trendDelta && (
        <div className={`text-xs font-medium ${trendPositive ? "text-emerald-500" : "text-rose-500"}`}>
          {trendLabel}: {trendDelta}
        </div>
      )}
      {footer && <div className="pt-2 text-xs text-foreground/60 border-t border-foreground/5">{footer}</div>}
    </div>
  );
}
