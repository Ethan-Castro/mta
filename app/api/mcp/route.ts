import { z } from "zod";
import { createMcpHandler } from "mcp-handler";
import { getRouteTotals, getHotspots } from "@/lib/data/violations";

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "ace_route_overview",
      "Summarize top ACE routes with violation and exempt counts",
      { limit: z.number().int().min(1).max(50).default(10) },
      async ({ limit }) => {
        const rows = await getRouteTotals({ limit });
        const formatted = rows
          .map((row, idx) => `${idx + 1}. ${row.busRouteId}: ${row.violations} violations, ${row.exemptCount} exempt`)
          .join("\n");
        return {
          content: [{ type: "text", text: formatted || "No routes available" }],
        };
      }
    );

    server.tool(
      "ace_hotspots",
      "List high-pressure ACE hotspots with coordinates",
      {
        limit: z.number().int().min(1).max(30).default(10),
        routeId: z.string().optional(),
      },
      async ({ limit, routeId }) => {
        const hotspots = await getHotspots({ limit, routeId });
        const formatted = hotspots
          .map(
            (spot, idx) =>
              `${idx + 1}. ${spot.busRouteId} | ${spot.stopName ?? "Unknown"}: ${spot.violations} violations @ (${spot.latitude}, ${spot.longitude})`
          )
          .join("\n");
        return {
          content: [{ type: "text", text: formatted || "No hotspots found" }],
        };
      }
    );
  },
  {},
  { basePath: "/api" }
);

export { handler as GET, handler as POST, handler as DELETE };
