import { experimental_createMCPClient } from "ai";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp";

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
 * - NEON_MCP_SSE_URL: e.g. "https://mcp.neon.tech/sse" (preferred for hosted Neon MCP)
 * - NEON_MCP_HTTP_URL: e.g. "https://mcp.neon.tech" (Streamable HTTP transport)
 */
export async function getNeonMCPTools(): Promise<MCPToolsBundle> {
	const clients: MCPClientLike[] = [];
	const toolSets: Record<string, any>[] = [];

	// Prefer SSE when provided
	const neonSseUrl = process.env.NEON_MCP_SSE_URL;
	if (neonSseUrl) {
		try {
			const transport = new SSEClientTransport(new URL(neonSseUrl));
			const client = await experimental_createMCPClient({ transport });
			clients.push(client as unknown as MCPClientLike);
			const tools = await client.tools();
			toolSets.push(tools);
		} catch (err) {
			// Best-effort: ignore if connection fails
		}
	}

	// Fallback: Streamable HTTP transport
	const neonHttpUrl = process.env.NEON_MCP_HTTP_URL;
	if (neonHttpUrl) {
		try {
			const transport = new StreamableHTTPClientTransport(new URL(neonHttpUrl));
			const client = await experimental_createMCPClient({ transport });
			clients.push(client as unknown as MCPClientLike);
			const tools = await client.tools();
			toolSets.push(tools);
		} catch (err) {
			// Best-effort: ignore if connection fails
		}
	}

	// Merge tool sets (later sets override name collisions)
	const tools = Object.assign({}, ...toolSets);

	async function closeAll() {
		await Promise.allSettled(clients.map((c) => c.close().catch(() => {})));
	}

	return { tools, clients, closeAll };
}
