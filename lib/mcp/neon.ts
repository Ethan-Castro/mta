import { experimental_createMCPClient, tool } from "ai";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { readEnv } from "@/lib/env";
import { sql as neonSql } from "@/lib/db";
import { z } from "zod";

export type MCPClientLike = {
	close: () => Promise<void>;
	tools: () => Promise<Record<string, any>>;
};

export type MCPToolsBundle = {
	tools: Record<string, any>;
	clients: MCPClientLike[];
	closeAll: () => Promise<void>;
};

/**
 * Connects to one or more MCP servers (e.g., Neon MCP) and aggregates their tools.
 *
 * Configuration (env):
 * - NEON_MCP_HTTP_URL: e.g. "https://mcp.neon.tech/mcp" (Streamable HTTP transport; recommended)
 * - NEON_MCP_SSE_URL: e.g. "https://mcp.neon.tech/sse" (SSE fallback if needed)
 */
export async function getNeonMCPTools(): Promise<MCPToolsBundle> {
	const clients: MCPClientLike[] = [];
	const toolSets: Record<string, any>[] = [];

  // Whitelist of allowed Neon MCP tools
  const allowed = new Set([
    "list_projects",
    "list_shared_projects",
    "describe_project",
    "get_connection_string",
    "run_sql",
    "run_sql_transaction",
    "get_database_tables",
    "describe_table_schema",
    "list_slow_queries",
    "explain_sql_statement",
    "prepare_query_tuning",
    "complete_query_tuning",
    "provision_neon_auth",
  ]);

  const rawToken =
    process.env.NEON_MCP_BEARER_TOKEN ??
    readEnv("NEON_MCP_BEARER_TOKEN") ??
    process.env.NEON_MCP_AUTH_TOKEN ??
    readEnv("NEON_MCP_AUTH_TOKEN") ??
    process.env.NEON_MCP_API_KEY ??
    readEnv("NEON_MCP_API_KEY") ??
    process.env.NEON_API_KEY ??
    readEnv("NEON_API_KEY") ??
    process.env.NEON_MCP_TOKEN ??
    readEnv("NEON_MCP_TOKEN");

  const authHeaders: Record<string, string> = {};
  if (rawToken) {
    authHeaders.Authorization = rawToken.startsWith("Bearer ") ? rawToken : `Bearer ${rawToken}`;
  }


	// Prefer Streamable HTTP transport for production
	const neonHttpUrl = process.env.NEON_MCP_HTTP_URL;
	if (neonHttpUrl) {
		try {
			const transport = new StreamableHTTPClientTransport(new URL(neonHttpUrl), {
				fetch: async (input, init) => {
					const mergedHeaders = new Headers(init?.headers ?? {});
					for (const [key, value] of Object.entries(authHeaders)) {
						mergedHeaders.set(key, value);
					}
					return fetch(input, { ...init, headers: mergedHeaders });
				},
			});
			const client = await experimental_createMCPClient({ transport: transport as any });
			clients.push(client as unknown as MCPClientLike);
			const tools = await client.tools();
			toolSets.push(tools);
		} catch (err) {
			// Best-effort: ignore if connection fails
		}
	}

  // Fallback: SSE when provided
	const neonSseUrl = process.env.NEON_MCP_SSE_URL;
	if (neonSseUrl) {
		try {
      const transport = new SSEClientTransport(new URL(neonSseUrl));
			const client = await experimental_createMCPClient({ transport: transport as any });
			clients.push(client as unknown as MCPClientLike);
			const tools = await client.tools();
			toolSets.push(tools);
		} catch (err) {
			// Best-effort: ignore if connection fails
		}
	}

  // Merge tool sets (later sets override name collisions)
  const mergedTools = Object.assign({}, ...toolSets);

  // Filter to allowed tools only
  const tools: Record<string, any> = {};
  for (const [name, impl] of Object.entries(mergedTools)) {
    if (allowed.has(name)) tools[name] = impl;
  }

  const localGetConnectionString = tool({
    description: "Return the configured database connection string (local fallback).",
    inputSchema: z.object({}),
    execute: async () => ({ connectionString: process.env.DATABASE_URL ?? null }),
  });

  const localListTables = tool({
    description: "List tables in the public schema (local fallback).",
    inputSchema: z.object({ schema: z.string().optional().default("public") }),
    execute: async ({ schema }) => {
      const rows = await (neonSql as any)`
        select table_name
        from information_schema.tables
        where table_schema = ${schema}
        order by table_name
      `;
      return { tables: rows.map((r: any) => r.table_name) };
    },
  });

  const localDescribeTable = tool({
    description: "Describe table columns (local fallback).",
    inputSchema: z.object({
      table: z.string(),
      schema: z.string().optional().default("public"),
    }),
    execute: async ({ table, schema }) => {
      const rows = await (neonSql as any)`
        select
          column_name as name,
          data_type as type,
          is_nullable = 'YES' as nullable,
          character_maximum_length as size,
          column_default as default_value
        from information_schema.columns
        where table_schema = ${schema} and table_name = ${table}
        order by ordinal_position
      `;
      return { table, columns: rows };
    },
  });

  // Very conservative read-only checker
  function isSelectOnly(sqlText: string): boolean {
    const t = sqlText.replace(/--.*?$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (!t) return false;
    const single = t.replace(/[;\s]+$/, "").trim().toLowerCase();
    if (!(single.startsWith("select") || single.startsWith("with "))) return false;
    const forbidden = ["insert","update","delete","drop","truncate","alter","grant","revoke","comment","create","attach","replace","vacuum","merge","call","execute"];
    return !forbidden.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(single));
  }

  const localRunSql = tool({
    description: "Execute a read-only SQL SELECT statement against the configured database.",
    inputSchema: z.object({ sql: z.string() }),
    execute: async ({ sql }: { sql: string }) => {
      try {
        if (!isSelectOnly(sql)) {
          return { error: "Only single read-only SELECT statements are permitted." };
        }
        const rows = await (neonSql as any).unsafe(sql);
        return { rows };
      } catch (err: any) {
        return { error: err?.message || "SQL execution failed" };
      }
    },
  });

  const localRunSqlTransaction = tool({
    description: "Execute multiple read-only SQL statements as a single operation (limited).",
    inputSchema: z.object({ statements: z.array(z.string()).min(1) }),
    execute: async ({ statements }: { statements: string[] }) => {
      try {
        const outputs: any[] = [];
        for (const s of statements) {
          if (!isSelectOnly(s)) return { error: "Only read-only SELECT statements are permitted." };
          const rows = await (neonSql as any).unsafe(s);
          outputs.push({ rows });
        }
        return { results: outputs };
      } catch (err: any) {
        return { error: err?.message || "Transaction failed" };
      }
    },
  });

  const localFallbacks: Record<string, any> = {
    get_connection_string: localGetConnectionString,
    get_database_tables: localListTables,
    describe_table_schema: localDescribeTable,
    run_sql: localRunSql,
    run_sql_transaction: localRunSqlTransaction,
  };

  for (const [name, impl] of Object.entries(localFallbacks)) {
    if (!tools[name]) {
      tools[name] = impl;
    }
  }

  // Always override `get_connection_string` with local wrapper to ensure
  // parameters schema is an OBJECT for AI Gateway/Gemini compatibility
  tools["get_connection_string"] = localGetConnectionString;

  // Tag each tool name as MCP-origin for UI filtering if needed
  // (keeps same callable interface; metadata can be inspected by the caller)
  for (const key of Object.keys(tools)) {
    try {
      (tools as any)[key].__origin = "mcp-neon";
    } catch {}
  }

	async function closeAll() {
		await Promise.allSettled(clients.map((c) => c.close().catch(() => {})));
	}

	return { tools, clients, closeAll };
}
