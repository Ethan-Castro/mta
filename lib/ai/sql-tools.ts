import { sql } from "@/lib/db";
import { dataApiCount, dataApiGet, eqFilter, filterParamsFromDateRange } from "@/lib/data-api";

export const ALLOWED_TABLES = [
  "violations",
  "cuny_campus_locations",
  "bus_segment_speeds_2025",
  "bus_segment_speeds_2023_2024",
] as const;

export type AllowedTable = typeof ALLOWED_TABLES[number];

const ALLOWED_TABLE_SET = new Set<AllowedTable>(ALLOWED_TABLES);

const TABLE_DATE_COLUMNS: Record<AllowedTable, readonly string[]> = {
  violations: ["last_occurrence", "first_occurrence"],
  cuny_campus_locations: [],
  bus_segment_speeds_2025: ["timestamp"],
  bus_segment_speeds_2023_2024: ["timestamp"],
};

const DEFAULT_DATE_COLUMN: Partial<Record<AllowedTable, string>> = {
  violations: "last_occurrence",
  bus_segment_speeds_2025: "timestamp",
  bus_segment_speeds_2023_2024: "timestamp",
};

export class SqlToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SqlToolError";
  }
}

export function ensureSelectAllowed(statement: string) {
  const trimmed = statement.trim();
  if (!trimmed.toLowerCase().startsWith("select")) {
    throw new SqlToolError("Only SELECT statements are allowed.");
  }
  if (trimmed.includes(";")) {
    throw new SqlToolError("Multiple statements are not allowed.");
  }
  const tables = extractTableNames(trimmed);
  const disallowed = tables.filter((table) => !ALLOWED_TABLE_SET.has(table as AllowedTable));
  if (disallowed.length) {
    throw new SqlToolError(`Access to table(s) not permitted: ${disallowed.join(", ")}.`);
  }
}

function extractTableNames(statement: string): string[] {
  const names: string[] = [];
  const regex = /\b(from|join)\s+([a-zA-Z0-9_."`]+)(?:\s+as)?/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(statement))) {
    let identifier = match[2].trim();
    if (!identifier || identifier.startsWith("(")) continue;
    identifier = identifier.replace(/["`]/g, "");
    identifier = identifier.split(/[\s,]/)[0];
    if (!identifier) continue;
    const parts = identifier.split(".");
    const normalized = parts[parts.length - 1]!.toLowerCase();
    names.push(normalized);
  }
  return names;
}

function validateTable(table: string): AllowedTable {
  const normalized = table.toLowerCase();
  if (!ALLOWED_TABLE_SET.has(normalized as AllowedTable)) {
    throw new SqlToolError(`Table \"${table}\" is not allowed.`);
  }
  return normalized as AllowedTable;
}

function coerceYear(year?: number) {
  if (year === undefined) return undefined;
  if (!Number.isInteger(year)) {
    throw new SqlToolError("Year must be an integer.");
  }
  if (year < 1900 || year > 2100) {
    throw new SqlToolError("Year must be between 1900 and 2100.");
  }
  return year;
}

function coerceISO(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new SqlToolError(`Invalid date: ${value}`);
  }
  return date.toISOString();
}

function buildDateColumn(table: AllowedTable, dateColumn?: string) {
  const allowedColumns = TABLE_DATE_COLUMNS[table];
  if (!allowedColumns.length) {
    if (dateColumn) {
      throw new SqlToolError(`Table ${table} does not support date filtering.`);
    }
    return undefined;
  }
  if (dateColumn) {
    if (!allowedColumns.includes(dateColumn)) {
      throw new SqlToolError(`Column ${dateColumn} is not allowed for table ${table}.`);
    }
    return dateColumn;
  }
  return DEFAULT_DATE_COLUMN[table] ?? allowedColumns[0];
}

function buildWhereClause(
  table: AllowedTable,
  options: { year?: number; startISO?: string; endISO?: string; column?: string; routeId?: string }
): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  const column = options.column;

  if (options.year !== undefined) {
    if (!column) throw new SqlToolError(`Year filtering not supported for table ${table}.`);
    params.push(options.year);
    conditions.push(`extract(year from ${column}) = $${params.length}`);
  }
  if (options.startISO) {
    if (!column) throw new SqlToolError(`Start date filtering not supported for table ${table}.`);
    params.push(options.startISO);
    conditions.push(`${column} >= $${params.length}`);
  }
  if (options.endISO) {
    if (!column) throw new SqlToolError(`End date filtering not supported for table ${table}.`);
    params.push(options.endISO);
    conditions.push(`${column} < $${params.length}`);
  }
  if (options.routeId) {
    params.push(options.routeId);
    conditions.push(`bus_route_id = $${params.length}`);
  }

  return {
    clause: conditions.join(" and "),
    params,
  };
}

export async function queryTableRowCount(params: {
  table: string;
  year?: number;
  start?: string;
  end?: string;
  dateColumn?: string;
}) {
  const table = validateTable(params.table);
  const year = coerceYear(params.year);
  const startISO = coerceISO(params.start);
  const endISO = coerceISO(params.end);
  if (startISO && endISO && startISO > endISO) {
    throw new SqlToolError("Start date must be before end date.");
  }
  const columnName = buildDateColumn(table, params.dateColumn);
  const qp: any = {
    ...filterParamsFromDateRange({ column: columnName, startISO, endISO }),
  };
  // PostgREST cannot express extract(year ...) directly; for year filter, approximate using gte/lt on first day / next year if date column exists
  if (year !== undefined && columnName) {
    qp[columnName] = qp[columnName]
      ? `${String(qp[columnName])},gte.${year}-01-01,lt.${year + 1}-01-01`
      : `gte.${year}-01-01,lt.${year + 1}-01-01`;
  }
  const count = await dataApiCount({ table, filterParams: qp });
  return {
    table,
    filters: {
      year: year ?? null,
      start: startISO ?? null,
      end: endISO ?? null,
      dateColumn: columnName ?? null,
    },
    count: Number(count),
  };
}

export async function queryViolationStats(params: {
  year?: number;
  start?: string;
  end?: string;
  routeId?: string;
}) {
  const table: AllowedTable = "violations";
  const columnName = DEFAULT_DATE_COLUMN[table] ?? "last_occurrence";
  const year = coerceYear(params.year);
  const startISO = coerceISO(params.start);
  const endISO = coerceISO(params.end);
  if (startISO && endISO && startISO > endISO) {
    throw new SqlToolError("Start date must be before end date.");
  }
  const baseFilters: any = {
    ...filterParamsFromDateRange({ column: columnName, startISO, endISO }),
  };
  if (params.routeId) Object.assign(baseFilters, eqFilter("bus_route_id", params.routeId));
  if (year !== undefined && columnName) {
    baseFilters[columnName] = baseFilters[columnName]
      ? `${String(baseFilters[columnName])},gte.${year}-01-01,lt.${year + 1}-01-01`
      : `gte.${year}-01-01,lt.${year + 1}-01-01`;
  }

  // totals (two counts via filters)
  const totalCount = await dataApiCount({ table, filterParams: baseFilters });
  const exemptFilters = { ...baseFilters, ...eqFilter("violation_status", "EXEMPT") } as any;
  const exemptCount = await dataApiCount({ table, filterParams: exemptFilters });

  // trend by month
  const trendRowsRaw = await dataApiGet<Array<{ month: string; violations: string | number }>>({
    table,
    params: {
      select: `month:date_trunc('month',${columnName}),violations:count(*)`,
      ...baseFilters,
      order: "month.asc",
      group: "month",
    },
  });
  const trendRows = trendRowsRaw.map((r) => ({ month: r.month, violations: Number(r.violations ?? 0) }));

  return {
    table,
    filters: {
      year: year ?? null,
      start: startISO ?? null,
      end: endISO ?? null,
      routeId: params.routeId ?? null,
      dateColumn: columnName,
    },
    totals: {
      violations: Number(totalCount ?? 0),
      exempt: Number(exemptCount ?? 0),
      nonExempt: Number(totalCount ?? 0) - Number(exemptCount ?? 0),
    },
    trend: trendRows.map((row: any) => ({ month: row.month, violations: Number(row.violations ?? 0) })),
  };
}

// Describe table schema for allowed tables only
export async function queryTableSchema(params: { table: string }) {
  const table = validateTable(params.table);
  const rows = await sql`
    select
      column_name,
      data_type,
      is_nullable,
      coalesce(character_maximum_length, numeric_precision)::text as size
    from information_schema.columns
    where table_schema = 'public' and table_name = ${table}
    order by ordinal_position
  `;
  return {
    table,
    columns: rows.map((r: any) => ({
      name: String(r.column_name),
      type: String(r.data_type),
      nullable: String(r.is_nullable).toLowerCase() === "yes",
      size: r.size != null ? String(r.size) : null,
    })),
  };
}
