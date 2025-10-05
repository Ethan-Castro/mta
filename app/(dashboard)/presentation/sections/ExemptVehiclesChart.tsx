"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type VehicleRow = {
  vehicleId: number;
  hashedId: string;
  violations: number;
  firstSeen: string;
  lastSeen: string;
  routeCount: number;
};

type ChartDatum = {
  vehicleLabel: string;
  violations: number;
  routeCount: number;
  firstSeen: string;
  lastSeen: string;
};

const RAW_DATA: VehicleRow[] = [
  {
    vehicleId: 43248,
    hashedId: "479d603cb0581d14fbaf8908f9f27ade6accce3a371895...",
    violations: 1377,
    firstSeen: "2023-10-31 17:33:21",
    lastSeen: "2025-08-19 21:37:18",
    routeCount: 2,
  },
  {
    vehicleId: 19321,
    hashedId: "1feaad876c46cfe1cc4ee357e410ec2054c5c231d26816...",
    violations: 1346,
    firstSeen: "2024-09-17 00:15:18",
    lastSeen: "2025-08-20 16:38:40",
    routeCount: 2,
  },
  {
    vehicleId: 66000,
    hashedId: "6d7caef8bf15e2bf8d46aa1e6dd8c0da1ae2fbc5b31ace...",
    violations: 949,
    firstSeen: "2024-07-19 14:44:40",
    lastSeen: "2025-08-20 22:58:39",
    routeCount: 10,
  },
  {
    vehicleId: 63587,
    hashedId: "6979a2434b4611cf1ebf80624eaeb29622929b061958b9...",
    violations: 924,
    firstSeen: "2023-09-19 08:40:51",
    lastSeen: "2025-08-17 10:16:25",
    routeCount: 7,
  },
  {
    vehicleId: 25819,
    hashedId: "2a8ac01b157a97b3c124cf33322e71c31062b815dd3b0a...",
    violations: 915,
    firstSeen: "2024-09-09 20:38:30",
    lastSeen: "2025-08-20 05:36:51",
    routeCount: 10,
  },
  {
    vehicleId: 134973,
    hashedId: "e020820037319aaca4e4ed8d3c29e907f203d722ea4629...",
    violations: 894,
    firstSeen: "2023-12-06 07:21:41",
    lastSeen: "2025-08-19 13:38:44",
    routeCount: 5,
  },
  {
    vehicleId: 141934,
    hashedId: "ebabc585284d95a10b6b45730c38fa55dfd57bcc5aea30...",
    violations: 842,
    firstSeen: "2024-10-12 12:36:03",
    lastSeen: "2025-08-20 19:51:36",
    routeCount: 11,
  },
  {
    vehicleId: 122884,
    hashedId: "cbebd9b5a63416b9c246a35d3b5fc36214871dab0e5ccf...",
    violations: 782,
    firstSeen: "2023-07-05 17:30:37",
    lastSeen: "2025-08-19 10:23:09",
    routeCount: 11,
  },
  {
    vehicleId: 51372,
    hashedId: "550bbcf6f5cf18ffe4ff0a02863a488dacf944ef726cf5...",
    violations: 725,
    firstSeen: "2022-12-20 17:03:15",
    lastSeen: "2025-08-08 20:32:22",
    routeCount: 4,
  },
  {
    vehicleId: 77724,
    hashedId: "80e7bae594e62aaaf4ed702b8230dfd12559743828922b...",
    violations: 691,
    firstSeen: "2024-04-18 16:39:52",
    lastSeen: "2025-08-13 03:38:06",
    routeCount: 11,
  },
  {
    vehicleId: 111865,
    hashedId: "b97dd1d54d4c1082f10c8186052403faffea893f8bf903...",
    violations: 688,
    firstSeen: "2022-11-28 14:07:34",
    lastSeen: "2025-08-20 10:17:25",
    routeCount: 8,
  },
  {
    vehicleId: 22107,
    hashedId: "24908a1da372fdb0f5f03bcf7001ee589cf492894d5792...",
    violations: 680,
    firstSeen: "2023-08-17 16:03:18",
    lastSeen: "2025-08-09 21:05:56",
    routeCount: 11,
  },
  {
    vehicleId: 15707,
    hashedId: "19eaa1782ca3f0078369198494889cbc6c9eb3537ede8f...",
    violations: 674,
    firstSeen: "2022-11-21 13:12:25",
    lastSeen: "2025-08-19 13:25:40",
    routeCount: 6,
  },
  {
    vehicleId: 127271,
    hashedId: "d3394e8be16cf7189dccc9b3621153fcffb272574bc307...",
    violations: 661,
    firstSeen: "2023-11-20 15:55:13",
    lastSeen: "2025-08-19 22:53:12",
    routeCount: 2,
  },
  {
    vehicleId: 37505,
    hashedId: "3e3e8a6a3ce6e635c9fb3d53b594777a1159e77bf186a3...",
    violations: 600,
    firstSeen: "2024-07-01 08:47:29",
    lastSeen: "2025-08-20 07:05:37",
    routeCount: 4,
  },
  {
    vehicleId: 51137,
    hashedId: "54b0d1ee49162c67afdbd6792626f413136d833428cdd3...",
    violations: 599,
    firstSeen: "2022-11-26 06:42:19",
    lastSeen: "2025-06-27 08:03:47",
    routeCount: 3,
  },
  {
    vehicleId: 144780,
    hashedId: "f05cb5bb4548794a854371c66198ca4ac67bad00b09695...",
    violations: 592,
    firstSeen: "2021-09-08 17:58:57",
    lastSeen: "2025-08-21 08:21:18",
    routeCount: 7,
  },
  {
    vehicleId: 12421,
    hashedId: "1458fd14b7fa31c655b9b74b8d3b83aed7ee855c8255fc...",
    violations: 589,
    firstSeen: "2022-11-21 08:10:07",
    lastSeen: "2025-08-18 06:27:29",
    routeCount: 8,
  },
  {
    vehicleId: 142281,
    hashedId: "ec330fbdbec0635dd38fea4d037e995c8eab16e4def4f3...",
    violations: 586,
    firstSeen: "2022-11-18 16:15:05",
    lastSeen: "2025-08-19 16:36:48",
    routeCount: 6,
  },
  {
    vehicleId: 58083,
    hashedId: "6059dcc4ef4516ca9f357ca2a789b9c4ca9c633258f212...",
    violations: 581,
    firstSeen: "2023-11-26 03:30:06",
    lastSeen: "2025-08-20 22:06:49",
    routeCount: 11,
  },
  {
    vehicleId: 83935,
    hashedId: "8b2b014569f5cee2c299002e65b542ef559c4b1e24c817...",
    violations: 579,
    firstSeen: "2022-11-30 09:31:18",
    lastSeen: "2025-08-19 18:41:41",
    routeCount: 5,
  },
  {
    vehicleId: 69079,
    hashedId: "729afe2bc01420ab8c66a36692cfc829ea5a0f829b17c7...",
    violations: 575,
    firstSeen: "2024-02-02 12:04:01",
    lastSeen: "2025-08-17 19:46:46",
    routeCount: 3,
  },
  {
    vehicleId: 92531,
    hashedId: "992b86a0166250ce8a3ef831a847ea8a0906d9a00b7a94...",
    violations: 574,
    firstSeen: "2024-07-05 14:18:22",
    lastSeen: "2025-08-20 16:25:26",
    routeCount: 2,
  },
  {
    vehicleId: 8886,
    hashedId: "0e92016a483877f5c62115578a642425d710c43560e00c...",
    violations: 565,
    firstSeen: "2023-08-05 11:17:28",
    lastSeen: "2025-08-19 09:34:27",
    routeCount: 10,
  },
  {
    vehicleId: 151130,
    hashedId: "fb0ef39318825c73839ed4f77bf96f6023f88a99d34569...",
    violations: 558,
    firstSeen: "2024-09-30 16:21:08",
    lastSeen: "2025-08-19 14:22:39",
    routeCount: 3,
  },
];

const chartData: ChartDatum[] = RAW_DATA.map((row) => ({
  vehicleLabel: `#${row.vehicleId}`,
  violations: row.violations,
  routeCount: row.routeCount,
  firstSeen: row.firstSeen,
  lastSeen: row.lastSeen,
}));

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload as ChartDatum | undefined;
  if (!datum) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-background/95 p-3 text-xs shadow-soft-lg">
      <p className="text-sm font-semibold text-foreground">Vehicle {datum.vehicleLabel}</p>
      <p className="text-foreground/80">Violations: {datum.violations.toLocaleString()}</p>
      <p className="text-foreground/70">Routes ridden: {datum.routeCount}</p>
      <p className="text-foreground/60">First seen: {datum.firstSeen.slice(0, 10)}</p>
      <p className="text-foreground/60">Last seen: {datum.lastSeen.slice(0, 10)}</p>
    </div>
  );
};

export default function ExemptVehiclesChart() {
  const metrics = useMemo(() => {
    const totalViolations = chartData.reduce((sum, row) => sum + row.violations, 0);
    const topFiveViolations = chartData.slice(0, 5).reduce((sum, row) => sum + row.violations, 0);
    const shareTopFive = Math.round((topFiveViolations / totalViolations) * 1000) / 10;
    const multiRouteCount = chartData.filter((row) => row.routeCount >= 5).length;
    const maxRoutes = chartData.reduce((max, row) => Math.max(max, row.routeCount), 0);
    const earliestFirstSeen = chartData.reduce((min, row) => {
      const time = new Date(row.firstSeen).getTime();
      return time < min ? time : min;
    }, Number.POSITIVE_INFINITY);
    const latestLastSeen = chartData.reduce((max, row) => {
      const time = new Date(row.lastSeen).getTime();
      return time > max ? time : max;
    }, Number.NEGATIVE_INFINITY);

    return {
      totalViolations,
      shareTopFive,
      multiRouteCount,
      maxRoutes,
      firstSeenWindowStart: new Date(earliestFirstSeen).toISOString().slice(0, 10),
      lastSeenWindowEnd: new Date(latestLastSeen).toISOString().slice(0, 10),
    };
  }, []);

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-foreground">
          Top 25 Repeat Exempt Vehicles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 16, bottom: 64, left: 0 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="vehicleLabel"
                angle={-50}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 11, fill: "hsl(var(--foreground) / 0.6)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--foreground) / 0.6)" }}
                width={60}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--primary) / 0.08)" }} />
              <Bar dataKey="violations" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 text-sm text-foreground/80">
          <p>
            {chartData[0].vehicleLabel} leads the list with {chartData[0].violations.toLocaleString()} camera
            violations. Collectively, the top 25 exempt vehicles were involved in {metrics.totalViolations.toLocaleString()} violations between {metrics.firstSeenWindowStart} and {metrics.lastSeenWindowEnd}.
          </p>
          <p>
            The highest-volume five vehicles account for about {metrics.shareTopFive}% of the total activity.
            Repeat offenders are not confined to a single corridor: {metrics.multiRouteCount} of the 25 operate on five or more routes, with the busiest vehicles touching up to {metrics.maxRoutes} routes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
