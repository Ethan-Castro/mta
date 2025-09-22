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
        return await (sql as any).unsafe(query);
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

export async function getNeonAgent(options?: { maxSteps?: number; includeMcp?: boolean; allowDestructive?: boolean }) {
  const maxSteps = options?.maxSteps ?? 8;
  const includeMcp = options?.includeMcp ?? true;
  const allowDestructive = options?.allowDestructive ?? false;

  const localTools = buildLocalSqlTools({ allowDestructive });

  let mcpBundle: Awaited<ReturnType<typeof getNeonMCPTools>> | null = null;
  if (includeMcp) {
    try {
      mcpBundle = await getNeonMCPTools();
    } catch {
      mcpBundle = null;
    }
  }

  const agent = new Agent({
    model: "openai/gpt-4o",
    stopWhen: stepCountIs(maxSteps),
    system: `You are a Neon Postgres engineering agent.
- Use tools to inspect schema, propose changes, and run safe SQL.
- Prefer creating tables idempotently and avoid destructive actions unless explicitly allowed.
- Provide concise results and follow-up recommendations.`,
    tools: {
      ...localTools,
      ...(mcpBundle?.tools ?? {}),
    },
  });

  async function close() {
    await mcpBundle?.closeAll?.();
  }

  return { agent, close };
}


