export type ToolLogEntry = {
  id: string;
  name: string;
  input?: unknown;
  output?: unknown;
  error?: string;
};

export type SummaryStats = {
  rows: Array<Record<string, unknown>>;
  totalViolations: number;
  totalExempt: number;
  routeCount: number;
  months: string[];
  exemptShare: number;
  topRoutes: Array<{ route: string; violations: number; exempt: number }>;
};

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return NUMBER_FORMAT.format(value);
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  return `${(value * 100).toFixed(1)}%`;
}

export function computeSummary(rows: Array<Record<string, unknown>>): SummaryStats {
  type RouteBucket = { route: string; violations: number; exempt: number };
  type Totals = {
    totalViolations: number;
    totalExempt: number;
    routeMap: Map<string, RouteBucket>;
    months: Set<string>;
  };

  const totals = rows.reduce<Totals>(
    (acc, row) => {
      const violations = Number(row?.violations ?? row?.count ?? 0);
      const exempt = Number(row?.exempt_count ?? 0);
      const route = String(row?.bus_route_id ?? "unknown");
      const month = String(row?.date_trunc_ym ?? "");

      if (Number.isFinite(violations)) {
        acc.totalViolations += violations;
      }
      if (Number.isFinite(exempt)) {
        acc.totalExempt += exempt;
      }

      const routeBucket = acc.routeMap.get(route) ?? {
        route,
        violations: 0,
        exempt: 0,
      };
      if (Number.isFinite(violations)) {
        routeBucket.violations += violations;
      }
      if (Number.isFinite(exempt)) {
        routeBucket.exempt += exempt;
      }
      acc.routeMap.set(route, routeBucket);

      if (month) {
        acc.months.add(month);
      }

      return acc;
    },
    {
      totalViolations: 0,
      totalExempt: 0,
      routeMap: new Map<string, RouteBucket>(),
      months: new Set<string>(),
    }
  );

  const topRoutes = Array.from(totals.routeMap.values())
    .sort((a, b) => b.violations - a.violations)
    .slice(0, 3);

  const months = Array.from(totals.months).sort();

  return {
    rows,
    totalViolations: totals.totalViolations,
    totalExempt: totals.totalExempt,
    routeCount: totals.routeMap.size,
    months,
    exemptShare:
      totals.totalViolations > 0
        ? totals.totalExempt / totals.totalViolations
        : 0,
    topRoutes,
  };
}

export function extractSummaryRows(toolLogs: ToolLogEntry[]): Array<Record<string, unknown>> | null {
  for (let index = toolLogs.length - 1; index >= 0; index -= 1) {
    const log = toolLogs[index];
    const output = log?.output as Record<string, unknown> | undefined;
    if (!output || typeof output !== "object") {
      continue;
    }
    const rows = (output as { rows?: unknown }).rows;
    if (Array.isArray(rows)) {
      return rows as Array<Record<string, unknown>>;
    }
  }
  return null;
}

function buildMonthRange(summary: SummaryStats | null): string | null {
  if (!summary || summary.months.length === 0) {
    return null;
  }
  if (summary.months.length === 1) {
    return summary.months[0] ?? null;
  }
  return `${summary.months[0]} → ${summary.months[summary.months.length - 1]}`;
}

export function buildAssistantFallback(
  summary: SummaryStats | null,
  toolLogs: ToolLogEntry[],
  question: string
): string | null {
  const trimmedQuestion = question.trim();

  if (summary) {
    const monthRange = buildMonthRange(summary);
    if (summary.totalViolations <= 0) {
      const lines = [
        trimmedQuestion
          ? `I queried ACE violations for “${trimmedQuestion}” but did not find any matching enforcement records.`
          : "No ACE violations matched the requested filters.",
        "",
        `- Routes checked: ${summary.routeCount}`,
        `- Exempt share: ${formatPercent(summary.exemptShare)} (${formatNumber(summary.totalExempt)} exempt)`,
      ];
      if (monthRange) {
        lines.push(`- Coverage window: ${monthRange}`);
      }
      return lines.join("\n");
    }

    const lines = [
      "### ACE enforcement summary",
      `- Violations: ${formatNumber(summary.totalViolations)} across ${summary.routeCount} routes`,
      `- Exempt share: ${formatPercent(summary.exemptShare)} (${formatNumber(summary.totalExempt)} exempt)`,
    ];

    if (monthRange) {
      lines.push(`- Coverage window: ${monthRange}`);
    }

    if (summary.topRoutes.length > 0) {
      lines.push("", "**Top routes**");
      summary.topRoutes.forEach((route) => {
        const routeLabel = route.route || "(unassigned)";
        lines.push(
          `- ${routeLabel}: ${formatNumber(route.violations)} violations (${formatNumber(route.exempt)} exempt)`
        );
      });
    }

    if (trimmedQuestion) {
      lines.push("", `Answer generated automatically because the model reply was empty for “${trimmedQuestion}”.`);
    }

    return lines.join("\n");
  }

  const errorLog = toolLogs.find((log) => Boolean(log.error));
  if (errorLog) {
    const prefix = trimmedQuestion
      ? `The ${errorLog.name} tool failed while answering “${trimmedQuestion}”.`
      : `The ${errorLog.name} tool failed.`;
    return `${prefix}\n\nError: ${errorLog.error}`;
  }

  if (toolLogs.length > 0) {
    const toolNames = Array.from(new Set(toolLogs.map((log) => log.name))).join(", ");
    if (trimmedQuestion) {
      return `I ran ${toolNames || "the requested tool"} but did not receive usable data for “${trimmedQuestion}”. Try refining the route or time period.`;
    }
    return `I ran ${toolNames || "the requested tool"} but did not receive usable data.`;
  }

  return null;
}
