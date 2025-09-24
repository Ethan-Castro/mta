"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type SparklinePoint = {
  label: string;
  value: number;
};

type Props = {
  data: SparklinePoint[];
  color?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
};

export default function Sparkline({
  data,
  color = "var(--chart-1)",
  height = 200,
  valueFormatter = (value) => value.toLocaleString(),
}: Props) {
  const gradientId = useId();

  if (!data?.length) {
    return (
      <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground sm:h-[150px]">
        Not enough data to render trend.
      </div>
    );
  }

  const axisColor = "color-mix(in srgb, var(--chart-1) 30%, transparent)";

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={`${gradientId}-sparkline`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.5} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" stroke={axisColor} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis hide domain={[0, (dataMax: number) => dataMax * 1.2]} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              fontSize: 11,
            }}
            formatter={(value: number) => [valueFormatter(value), "Violations"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId}-sparkline)`}
            activeDot={{ r: 3 }}
            name="Violations"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
