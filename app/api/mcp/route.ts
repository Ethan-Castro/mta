import { z } from "zod";
import { createMcpHandler } from "mcp-handler";
import { getRouteTotals, getHotspots, getViolationSummary, getExemptRepeaters } from "@/lib/data/violations";
import { createSocrataFromEnv, SocrataClient } from "@/lib/data/socrata";
import { CUNY_CAMPUSES } from "@/lib/data/cuny";
import {
  ROUTE_COMPARISONS,
  STUDENT_COMMUTE_PROFILES,
  CBD_ROUTE_TRENDS,
  VIOLATION_HOTSPOTS
} from "@/lib/data/insights";

const handler = createMcpHandler(
  (server) => {
    // Existing ACE tools
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

    // Enhanced violation analysis tools
    server.tool(
      "ace_violation_trends",
      "Get monthly violation trends for specific routes",
      {
        routeId: z.string().describe("Bus route ID"),
        limit: z.number().int().min(1).max(50).default(12),
      },
      async ({ routeId, limit }) => {
        const summary = await getViolationSummary({ routeId, limit });
        const formatted = summary
          .slice()
          .sort((a, b) => a.month.localeCompare(b.month))
          .map(row => `${row.month}: ${row.violations} violations (${row.exemptCount} exempt)`)
          .join("\n");
        return {
          content: [{ type: "text", text: formatted || "No trend data available" }],
        };
      }
    );

    server.tool(
      "ace_exempt_repeaters",
      "Find vehicles with repeated exempt violations",
      {
        minOccurrences: z.number().int().min(1).max(50).default(5),
        limit: z.number().int().min(1).max(20).default(10),
        routeId: z.string().optional(),
      },
      async ({ minOccurrences, limit, routeId }) => {
        const repeaters = await getExemptRepeaters({ minOccurrences, limit, routeId });
        const formatted = repeaters
          .map((repeater, idx) =>
            `${idx + 1}. ${repeater.vehicleId}: ${repeater.violations} violations across routes: ${repeater.routes.join(", ")}`
          )
          .join("\n");
        return {
          content: [{ type: "text", text: formatted || "No repeaters found" }],
        };
      }
    );

    // CUNY campus tools
    server.tool(
      "cuny_campuses_overview",
      "List all CUNY campuses with location and type information",
      { campusType: z.string().optional() },
      async ({ campusType }) => {
        const campuses = campusType
          ? CUNY_CAMPUSES.filter(c => c.type === campusType)
          : CUNY_CAMPUSES;

        const formatted = campuses
          .map((campus, idx) =>
            `${idx + 1}. ${campus.campus} (${campus.type}) - ${campus.city}, ${campus.state} @ (${campus.latitude}, ${campus.longitude})`
          )
          .join("\n");
        return {
          content: [{ type: "text", text: formatted || "No campuses found" }],
        };
      }
    );

    server.tool(
      "cuny_campus_by_route",
      "Find CUNY campuses near specific bus routes",
      { routeId: z.string() },
      async ({ routeId }) => {
        const nearbyCampuses = CUNY_CAMPUSES.filter(campus => {
          // Simple proximity check - can be enhanced with proper geospatial queries
          const routeMatch = ROUTE_COMPARISONS.find(r => r.routeId === routeId);
          return routeMatch && routeMatch.campus === campus.campus;
        });

        const formatted = nearbyCampuses
          .map((campus, idx) =>
            `${idx + 1}. ${campus.campus} (${campus.type}) - ${campus.address}, ${campus.city}, ${campus.state}`
          )
          .join("\n");
        return {
          content: [{ type: "text", text: formatted || "No nearby campuses found" }],
        };
      }
    );

    // Socrata data tools
    server.tool(
      "nyc_open_data_query",
      "Query NYC Open Data portal datasets",
      {
        datasetId: z.string().describe("Dataset identifier"),
        params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().default({}),
      },
      async ({ datasetId, params = {} }) => {
        try {
          const socrata = createSocrataFromEnv();
          const data = await socrata.get(datasetId, params);
          return {
            content: [{
              type: "text",
              text: `Retrieved ${Array.isArray(data) ? data.length : 1} records from dataset ${datasetId}. Sample: ${JSON.stringify(Array.isArray(data) ? data.slice(0, 3) : data, null, 2)}`
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error querying dataset ${datasetId}: ${error instanceof Error ? error.message : String(error)}`
            }],
          };
        }
      }
    );

    // Insight and analysis tools
    server.tool(
      "ace_route_comparison",
      "Compare ACE and non-ACE routes with performance metrics",
      { campusType: z.string().optional() },
      async ({ campusType }) => {
        const routes = campusType
          ? ROUTE_COMPARISONS.filter(r => r.campusType === campusType)
          : ROUTE_COMPARISONS;

        const formatted = routes
          .map((route, idx) => {
            const aceStatus = route.aceEnforced ? "ACE Enforced" : "No ACE";
            const speedChange = route.speedChangePct > 0 ? `+${route.speedChangePct}%` : `${route.speedChangePct}%`;
            return `${idx + 1}. ${route.routeId} (${aceStatus}): ${speedChange} speed change, ${route.averageMonthlyViolations} avg monthly violations, ${route.exemptSharePct}% exempt`;
          })
          .join("\n");
        return {
          content: [{ type: "text", text: formatted || "No route comparisons available" }],
        };
      }
    );

    server.tool(
      "student_commute_analysis",
      "Analyze student commute patterns and recommendations",
      { campus: z.string().optional() },
      async ({ campus }) => {
        const profiles = campus
          ? STUDENT_COMMUTE_PROFILES.filter(p => p.campus.toLowerCase().includes(campus.toLowerCase()))
          : STUDENT_COMMUTE_PROFILES;

        const formatted = profiles
          .map((profile, idx) => {
            return `${idx + 1}. ${profile.campus} (${profile.campusType}):
- Primary route: ${profile.primaryRoute.id} (${profile.primaryRoute.reliabilityScore})
- Speed change: ${profile.primaryRoute.speedChangePct > 0 ? '+' : ''}${profile.primaryRoute.speedChangePct}%
- Travel time delta: ${profile.travelTimeDelta}
- Recommendation: ${profile.recommendation}`;
          })
          .join("\n\n");
        return {
          content: [{ type: "text", text: formatted || "No commute profiles available" }],
        };
      }
    );

    server.tool(
      "cbd_congestion_analysis",
      "Analyze congestion pricing impact on CBD routes",
      {},
      async () => {
        const formatted = CBD_ROUTE_TRENDS
          .map((route, idx) => {
            const change = route.violationChangePct > 0 ? `+${route.violationChangePct}%` : `${route.violationChangePct}%`;
            const speedChange = route.speedChangePct > 0 ? `+${route.speedChangePct}%` : `${route.speedChangePct}%`;
            return `${idx + 1}. ${route.routeName} (${route.crossesCbd ? 'CBD' : 'Non-CBD'}):
- Violations: ${change} post-pricing
- Speed: ${speedChange}
- Highlight: ${route.highlight}`;
          })
          .join("\n");
        return {
          content: [{ type: "text", text: formatted || "No CBD analysis available" }],
        };
      }
    );

    // Multi-dimensional analysis tool
    server.tool(
      "comprehensive_transit_analysis",
      "Perform comprehensive analysis combining multiple data sources",
      {
        focus: z.enum(["campus_impact", "route_efficiency", "enforcement_gaps", "policy_recommendations"]),
        routeId: z.string().optional(),
        campus: z.string().optional(),
      },
      async ({ focus, routeId, campus }) => {
        let analysis = "";

        switch (focus) {
          case "campus_impact":
            if (campus) {
              const campusProfile = STUDENT_COMMUTE_PROFILES.find(p =>
                p.campus.toLowerCase().includes(campus.toLowerCase())
              );
              const relatedRoutes = ROUTE_COMPARISONS.filter(r =>
                r.campus.toLowerCase().includes(campus.toLowerCase())
              );

              analysis = `Campus Impact Analysis for ${campus}:

Student Profile:
- ${campusProfile?.avgDailyStudents.toLocaleString()} daily students
- Primary route: ${campusProfile?.primaryRoute.name} (${campusProfile?.primaryRoute.reliabilityScore})
- Travel time change: ${campusProfile?.travelTimeDelta}

Route Performance:
${relatedRoutes.map(r => `- ${r.routeId}: ${r.speedChangePct > 0 ? '+' : ''}${r.speedChangePct}% speed change, ${r.averageMonthlyViolations} monthly violations`).join('\n')}

Key Insights:
${campusProfile?.recommendation || 'No specific recommendations available'}`;
            }
            break;

          case "route_efficiency":
            if (routeId) {
              const route = ROUTE_COMPARISONS.find(r => r.routeId === routeId);
              const violations = await getViolationSummary({ routeId, limit: 6 });

              analysis = `Route Efficiency Analysis for ${routeId}:

Performance Metrics:
- Speed change: ${route ? (route.speedChangePct > 0 ? '+' : '') + route.speedChangePct + '%' : 'N/A'}
- Monthly violations: ${route?.averageMonthlyViolations || 'N/A'}
- Exempt share: ${route?.exemptSharePct + '%' || 'N/A'}

Recent Trends:
${violations.slice(-3).map(v => `${v.month}: ${v.violations} violations`).join('\n')}

Context: ${route?.narrative || 'No additional context available'}`;
            }
            break;

          case "enforcement_gaps":
            const hotspots = await getHotspots({ limit: 5 });
            const repeaters = await getExemptRepeaters({ limit: 5 });

            analysis = `Enforcement Gaps Analysis:

Top Hotspots:
${hotspots.slice(0, 3).map(h => `- ${h.busRouteId} ${h.stopName}: ${h.violations} violations`).join('\n')}

Exempt Repeaters:
${repeaters.slice(0, 3).map(r => `- ${r.vehicleId}: ${r.violations} violations across ${r.routes.length} routes`).join('\n')}

Recommendations:
- Focus enforcement on identified hotspots
- Review exempt vehicle patterns
- Consider expanding ACE coverage to high-violation areas`;
            break;

          case "policy_recommendations":
            const aceRoutes = ROUTE_COMPARISONS.filter(r => r.aceEnforced);
            const nonAceRoutes = ROUTE_COMPARISONS.filter(r => !r.aceEnforced);

            analysis = `Policy Recommendations:

ACE Performance:
- ${aceRoutes.length} routes with ACE coverage show average ${(aceRoutes.reduce((acc, r) => acc + r.speedChangePct, 0) / aceRoutes.length).toFixed(1)}% speed improvement
- ${nonAceRoutes.length} routes without ACE show average ${(nonAceRoutes.reduce((acc, r) => acc + r.speedChangePct, 0) / nonAceRoutes.length).toFixed(1)}% speed change

Priority Actions:
1. Expand ACE to ${nonAceRoutes.filter(r => r.studentShare > 0.4).map(r => r.routeId).join(', ')} (high student impact routes)
2. Address exempt vehicle patterns in ${VIOLATION_HOTSPOTS.slice(0, 3).map(h => h.location).join(', ')}
3. Monitor congestion pricing impact on CBD routes: ${CBD_ROUTE_TRENDS.filter(r => r.crossesCbd).slice(0, 3).map(r => r.routeName).join(', ')}`;
            break;
        }

        return {
          content: [{ type: "text", text: analysis || "No analysis available for the specified parameters" }],
        };
      }
    );
  },
  {},
  { basePath: "/api" }
);

export { handler as GET, handler as POST, handler as DELETE };
