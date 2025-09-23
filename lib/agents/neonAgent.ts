import { Experimental_Agent as Agent, stepCountIs, tool } from "ai";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getNeonMCPTools } from "@/lib/mcp/neon";

function buildLocalSqlTools(options: { allowDestructive: boolean }) {
  const { allowDestructive } = options;

  return {
    run_sql: tool({
      description: "Execute SQL against the configured Neon database (DATABASE_URL).",
      inputSchema: z.object({
        query: z.string().describe("SQL to run"),
      }),
      execute: async ({ query }) => {
        if (!allowDestructive && /\b(drop|truncate)\b/i.test(query)) {
          throw new Error("Destructive statements are blocked. Enable allowDestructive to proceed.");
        }
        const rows = await (sql as any).unsafe(query);
        return { rows };
      },
    }),

    run_sql_transaction: tool({
      description: "Execute multiple SQL statements in a single transaction.",
      inputSchema: z.object({
        queries: z.array(z.string()).min(1),
      }),
      execute: async ({ queries }) => {
        if (!allowDestructive) {
          for (const q of queries) {
            if (/\b(drop|truncate)\b/i.test(q)) {
              throw new Error("Destructive statements are blocked. Enable allowDestructive to proceed.");
            }
          }
        }
        await (sql as any).unsafe("BEGIN");
        try {
          const results: any[] = [];
          for (const q of queries) {
            // eslint-disable-next-line no-await-in-loop
            results.push(await (sql as any).unsafe(q));
          }
          await (sql as any).unsafe("COMMIT");
          return { results };
        } catch (err) {
          try { await (sql as any).unsafe("ROLLBACK"); } catch {}
          throw err;
        }
      },
    }),
  } as const;
}

export async function getNeonAgent(options?: { maxSteps?: number; allowDestructive?: boolean; includeMcp?: boolean }) {
  const maxSteps = options?.maxSteps ?? 8;
  const allowDestructive = options?.allowDestructive ?? false;
  const includeMcp = options?.includeMcp !== false;

  const localTools = buildLocalSqlTools({ allowDestructive });

  let mcpCloseAll: null | (() => Promise<void>) = null;
  let mcpTools: Record<string, any> = {};
  if (includeMcp) {
    try {
      const bundle = await getNeonMCPTools();
      mcpTools = bundle.tools ?? {};
      mcpCloseAll = bundle.closeAll;
    } catch {
      mcpTools = {};
      mcpCloseAll = null;
    }
  }

  // Helpful aliases to match common tool names used by prompts/UIs,
  // with SQL fallbacks when MCP tools are unavailable
  const aliasTools: Record<string, any> = {};

  // listTables → prefers MCP get_database_tables
  if (mcpTools.get_database_tables) {
    aliasTools.listTables = mcpTools.get_database_tables;
  } else {
    aliasTools.listTables = tool({
      description: "List table names in a schema (fallback)",
      inputSchema: z.object({
        schema: z.string().default("public"),
      }),
      execute: async ({ schema }) => {
        const rows = await (sql as any)`
          select table_name
          from information_schema.tables
          where table_schema = ${schema}
          order by table_name
        `;
        return { tables: (rows as any[]).map((r: any) => r.table_name) };
      },
    });
  }

  // describeTable → prefers MCP describe_table_schema
  if (mcpTools.describe_table_schema) {
    aliasTools.describeTable = mcpTools.describe_table_schema;
  } else {
    aliasTools.describeTable = tool({
      description: "Describe a table's columns (fallback)",
      inputSchema: z.object({
        table: z.string().describe("Table name"),
        schema: z.string().optional().default("public"),
      }),
      execute: async ({ table, schema }) => {
        const rows = await (sql as any)`
          select
            column_name as name,
            data_type as type,
            (is_nullable = 'YES') as nullable,
            character_maximum_length as size
          from information_schema.columns
          where table_schema = ${schema} and table_name = ${table}
          order by ordinal_position
        `;
        return { table, columns: rows };
      },
    });
  }

  // runSql alias accepting { sql } and returning { rows }
  const runSql = tool({
    description: "Execute arbitrary SQL (alias; prefers SELECT).",
    inputSchema: z.object({
      sql: z.string().describe("SQL to run"),
    }),
    execute: async ({ sql: query }) => {
      if (!allowDestructive && /\b(drop|truncate)\b/i.test(query)) {
        throw new Error("Destructive statements are blocked. Enable allowDestructive to proceed.");
      }
      const rows = await (sql as any).unsafe(query);
      return { rows };
    },
  });

  // runSqlTransaction alias accepting { sql: string[] }
  const runSqlTransaction = tool({
    description: "Execute multiple SQL statements in a transaction (alias).",
    inputSchema: z.object({
      sql: z.array(z.string()).min(1),
    }),
    execute: async ({ sql: queries }) => {
      if (!allowDestructive) {
        for (const q of queries) {
          if (/\b(drop|truncate)\b/i.test(q)) {
            throw new Error("Destructive statements are blocked. Enable allowDestructive to proceed.");
          }
        }
      }
      await (sql as any).unsafe("BEGIN");
      try {
        const results: any[] = [];
        for (const q of queries) {
          // eslint-disable-next-line no-await-in-loop
          results.push(await (sql as any).unsafe(q));
        }
        await (sql as any).unsafe("COMMIT");
        return { results };
      } catch (err) {
        try { await (sql as any).unsafe("ROLLBACK"); } catch {}
        throw err;
      }
    },
  });

  const agent = new Agent({
    model: "openai/gpt-5-mini",
    stopWhen: stepCountIs(maxSteps),
    system: `You are a Neon Postgres engineering agent.
- Use tools to inspect schema, propose changes, and run safe SQL.
- Prefer creating tables idempotently and avoid destructive actions unless explicitly allowed.
- Provide concise results and follow-up recommendations.`,
    tools: {
      ...localTools,
      ...mcpTools,
      ...aliasTools,
      runSql,
      runSqlTransaction,
    },
  });

  async function close() {
    if (typeof mcpCloseAll === "function") {
      try { await mcpCloseAll(); } catch {}
    }
  }

  return { agent, close };
}


