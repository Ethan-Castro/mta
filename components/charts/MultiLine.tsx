"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SeriesPoint = {
  label: string;
  [seriesName: string]: string | number;
};

type Marker = {
  x: string;
  label?: string;
};

type Props = {
  data: SeriesPoint[];
  series: string[];
  height?: number;
  yLabel?: string;
  marker?: Marker | null;
};

const DEFAULT_COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#84cc16",
];

export default function MultiLine({
  data,
  series,
  height = 260,
  yLabel,
  marker = null,
}: Props) {
  const axisColor = "rgba(8, 23, 156, 0.25)";

  if (!Array.isArray(data) || data.length === 0 || !Array.isArray(series) || series.length === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground sm:h-[150px]">
        Not enough data to render chart.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={axisColor} />
          <XAxis dataKey="label" stroke={axisColor} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis stroke={axisColor} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", offset: 8 } : undefined} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              fontSize: 11,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((name, idx) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}
          {marker?.x ? (
            <ReferenceLine x={marker.x} stroke="#64748b" strokeDasharray="6 6" label={{ value: marker.label ?? marker.x, position: "insideTopLeft", fontSize: 10, fill: "#64748b" }} />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


