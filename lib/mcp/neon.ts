import { experimental_createMCPClient } from "ai";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

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


	// Prefer Streamable HTTP transport for production
	const neonHttpUrl = process.env.NEON_MCP_HTTP_URL;
	if (neonHttpUrl) {
		try {
			const transport = new StreamableHTTPClientTransport(new URL(neonHttpUrl));
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
