"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type BarDatum = {
  label: string;
  value: number;
};

type Props = {
  data: BarDatum[];
  height?: number;
  color?: string;
  yLabel?: string;
};

export default function BarChartBasic({ data, height = 240, color = "var(--chart-1)", yLabel = "Value" }: Props) {
  if (!data?.length) {
    return (
      <div className="flex h-[150px] items-center justify-center text-xs text-muted-foreground sm:h-[180px]">
        Not enough data to render chart.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 12, left: 8, right: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in srgb, var(--chart-1) 12%, transparent)" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} height={40} angle={-15} textAnchor="end" />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={50} label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 10 }} />
          <Tooltip
            wrapperStyle={{ zIndex: 10 }}
            contentStyle={{ background: "var(--card)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 11 }}
            formatter={(value: number) => [Number(value).toLocaleString(), yLabel]}
          />
          <Bar dataKey="value" name={yLabel} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

