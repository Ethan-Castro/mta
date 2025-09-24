"use client";

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";

export type PieDatum = {
  label: string;
  value: number;
};

type Props = {
  data: PieDatum[];
  height?: number;
  colors?: string[];
  showLegend?: boolean;
};

const DEFAULT_COLORS = ["#08179c", "#ffcd00", "#22c55e", "#e11d48", "#06b6d4", "#a855f7", "#f97316", "#475569"];

export default function PieChartBasic({ data, height = 240, colors = DEFAULT_COLORS, showLegend = true }: Props) {
  if (!data?.length) {
    return (
      <div className="flex h-[150px] items-center justify-center text-xs text-muted-foreground sm:h-[180px]">
        Not enough data to render chart.
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + (Number.isFinite(d.value) ? d.value : 0), 0) || 1;

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={Math.min(height / 2 - 10, 120)} label>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "var(--card)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 11 }}
            formatter={(value: number, name: string) => {
              const pct = total ? Math.round((Number(value) / total) * 1000) / 10 : 0;
              return [`${Number(value).toLocaleString()} (${pct}%)`, String(name)];
            }}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}


