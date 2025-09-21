"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type GroupedBarDatum = {
  name: string;
  violations: number;
  exempt: number;
};

type Props = {
  data: GroupedBarDatum[];
  height?: number;
  showLegend?: boolean;
};

export default function GroupedBar({ data, height = 260, showLegend = true }: Props) {
  if (!data?.length) {
    return (
      <div className="flex h-[180px] items-center justify-center text-xs text-muted-foreground">
        Not enough data to render comparison.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 12, left: 12, right: 12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(8, 23, 156, 0.08)" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} interval={0} height={50} angle={-15} textAnchor="end" />
          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
          <Tooltip
            wrapperStyle={{ zIndex: 10 }}
            contentStyle={{
              background: "var(--card)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
            formatter={(value: number, key) => [value.toLocaleString(), key === "violations" ? "Violations" : "Exempt"]}
          />
          {showLegend && (
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: 12, paddingBottom: 12 }}
            />
          )}
          <Bar dataKey="violations" name="Violations" fill="#08179c" radius={[6, 6, 0, 0]} />
          <Bar dataKey="exempt" name="Exempt" fill="#ffcd00" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
