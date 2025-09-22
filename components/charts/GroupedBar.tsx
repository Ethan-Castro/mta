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
      <div className="flex h-[150px] items-center justify-center text-xs text-muted-foreground sm:h-[180px]">
        Not enough data to render comparison.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 12, left: 8, right: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(8, 23, 156, 0.08)" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 10 }} 
            axisLine={false} 
            tickLine={false} 
            interval={0} 
            height={40} 
            angle={-15} 
            textAnchor="end" 
          />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
          <Tooltip
            wrapperStyle={{ zIndex: 10 }}
            contentStyle={{
              background: "var(--card)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              fontSize: 11,
            }}
            formatter={(value: number, key) => [value.toLocaleString(), key === "violations" ? "Violations" : "Exempt"]}
          />
          {showLegend && (
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
            />
          )}
          <Bar dataKey="violations" name="Violations" fill="#08179c" radius={[4, 4, 0, 0]} />
          <Bar dataKey="exempt" name="Exempt" fill="#ffcd00" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
