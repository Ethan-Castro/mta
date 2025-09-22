import { z } from "zod";
import { createMcpHandler } from "mcp-handler";
import { getRouteTotals, getHotspots, getViolationSummary, getExemptRepeaters } from "@/lib/data/violations";
import { createSocrataFromEnv, SocrataClient } from "@/lib/data/socrata";
import { getCampuses } from "@/lib/data/cuny";
import { getRouteComparisons, getStudentCommuteProfiles, getCbdRouteTrends, getCuratedHotspots } from "@/lib/data/insights";
import type { RouteComparison, StudentCommuteProfile, CbdRouteTrend, ViolationHotspot } from "@/lib/data/insights";
import type { Campus } from "@/lib/data/cuny";

let routeComparisonsPromise: Promise<RouteComparison[]> | null = null;
function getRouteComparisonsCached() {
  if (!routeComparisonsPromise) {
    routeComparisonsPromise = getRouteComparisons().catch((error) => {
      routeComparisonsPromise = null;
      throw error;
    });
  }
  return routeComparisonsPromise;
}

let studentProfilesPromise: Promise<StudentCommuteProfile[]> | null = null;
function getStudentProfilesCached() {
  if (!studentProfilesPromise) {
    studentProfilesPromise = getStudentCommuteProfiles().catch((error) => {
      studentProfilesPromise = null;
      throw error;
    });
  }
  return studentProfilesPromise;
}

let cbdRouteTrendsPromise: Promise<CbdRouteTrend[]> | null = null;
function getCbdRouteTrendsCached() {
  if (!cbdRouteTrendsPromise) {
    cbdRouteTrendsPromise = getCbdRouteTrends().catch((error) => {
      cbdRouteTrendsPromise = null;
      throw error;
    });
  }
  return cbdRouteTrendsPromise;
}

let curatedHotspotsPromise: Promise<ViolationHotspot[]> | null = null;
function getCuratedHotspotsCached() {
  if (!curatedHotspotsPromise) {
    curatedHotspotsPromise = getCuratedHotspots().catch((error) => {
      curatedHotspotsPromise = null;
      throw error;
    });
  }
  return curatedHotspotsPromise;
}

let campusesPromise: Promise<Campus[]> | null = null;
function getCampusesCached() {
  if (!campusesPromise) {
    campusesPromise = getCampuses().catch((error) => {
      campusesPromise = null;
      throw error;
    });
  }
  return campusesPromise;
}

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
        const campuses = await getCampusesCached();
        const filtered = campusType
          ? campuses.filter((c) => (c.type ?? "").toLowerCase() === campusType.toLowerCase())
          : campuses;

        const formatted = filtered
          .map((campus, idx) =>
            `${idx + 1}. ${campus.campus} (${campus.type ?? "Unknown"}) - ${campus.city ?? "Unknown"}, ${campus.state ?? ""} @ (${campus.latitude ?? "n/a"}, ${campus.longitude ?? "n/a"})`
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
        const [campuses, routes] = await Promise.all([
          getCampusesCached(),
          getRouteComparisonsCached(),
        ]);
        const routeMatch = routes.find((r) => r.routeId === routeId);
        const nearbyCampuses = routeMatch
          ? campuses.filter((campus) => campus.campus === routeMatch.campus)
          : [];

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
        const routes = await getRouteComparisonsCached();
        const filtered = campusType
          ? routes.filter((r) => r.campusType === campusType)
          : routes;

        const formatted = filtered
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
        const profilesData = await getStudentProfilesCached();
        const profiles = campus
          ? profilesData.filter((p) => p.campus.toLowerCase().includes(campus.toLowerCase()))
          : profilesData;

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
        const trends = await getCbdRouteTrendsCached();
        const formatted = trends
          .map((route, idx) => {
            const violationChange = Number(route.violationChangePct ?? 0);
            const speedChange = Number(route.speedChangePct ?? 0);
            const violationText = `${violationChange > 0 ? '+' : ''}${violationChange}%`;
            const speedText = `${speedChange > 0 ? '+' : ''}${speedChange}%`;
            return `${idx + 1}. ${route.routeName} (${route.crossesCbd ? 'CBD' : 'Non-CBD'}):
- Violations: ${violationText} post-pricing
- Speed: ${speedText}
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
              const [profiles, routes] = await Promise.all([
                getStudentProfilesCached(),
                getRouteComparisonsCached(),
              ]);
              const campusProfile = profiles.find((p) =>
                p.campus.toLowerCase().includes(campus.toLowerCase())
              );
              const relatedRoutes = routes.filter((r) =>
                r.campus.toLowerCase().includes(campus.toLowerCase())
              );

              analysis = `Campus Impact Analysis for ${campus}:

Student Profile:
- ${campusProfile?.avgDailyStudents?.toLocaleString() ?? 'n/a'} daily students
- Primary route: ${campusProfile?.primaryRoute.id ?? 'n/a'} (${campusProfile?.primaryRoute.reliabilityScore ?? 'n/a'})
- Travel time change: ${campusProfile?.travelTimeDelta ?? 'n/a'}

Route Performance:
${relatedRoutes.map((r) => `- ${r.routeId}: ${Number(r.speedChangePct ?? 0) > 0 ? '+' : ''}${Number(r.speedChangePct ?? 0)}% speed change, ${r.averageMonthlyViolations ?? 'n/a'} monthly violations`).join('\n')}

Key Insights:
${campusProfile?.recommendation || 'No specific recommendations available'}`;
            }
            break;

          case "route_efficiency":
            if (routeId) {
              const routes = await getRouteComparisonsCached();
              const route = routes.find((r) => r.routeId === routeId);
              const violations = await getViolationSummary({ routeId, limit: 6 });

              analysis = `Route Efficiency Analysis for ${routeId}:

Performance Metrics:
- Speed change: ${route ? (Number(route.speedChangePct ?? 0) > 0 ? '+' : '') + Number(route.speedChangePct ?? 0) + '%' : 'N/A'}
- Monthly violations: ${route?.averageMonthlyViolations ?? 'N/A'}
- Exempt share: ${route?.exemptSharePct !== undefined ? route.exemptSharePct + '%' : 'N/A'}

Recent Trends:
${violations.slice(-3).map((v) => `${v.month}: ${v.violations} violations`).join('\n')}

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

          case "policy_recommendations": {
            const [routes, hotspots, cbdTrends] = await Promise.all([
              getRouteComparisonsCached(),
              getCuratedHotspotsCached(),
              getCbdRouteTrendsCached(),
            ]);
            const aceRoutes = routes.filter((r) => r.aceEnforced);
            const nonAceRoutes = routes.filter((r) => !r.aceEnforced);
            const aceSpeedAvg = aceRoutes.length
              ? aceRoutes.reduce((acc, r) => acc + Number(r.speedChangePct ?? 0), 0) / aceRoutes.length
              : 0;
            const nonAceSpeedAvg = nonAceRoutes.length
              ? nonAceRoutes.reduce((acc, r) => acc + Number(r.speedChangePct ?? 0), 0) / nonAceRoutes.length
              : 0;

            const highImpactRoutes = nonAceRoutes
              .filter((r) => Number(r.studentShare ?? 0) > 0.4)
              .map((r) => r.routeId)
              .join(', ');
            const hotspotNames = hotspots.slice(0, 3).map((h) => h.location ?? h.id).join(', ');
            const cbdFocus = cbdTrends
              .filter((r) => r.crossesCbd)
              .slice(0, 3)
              .map((r) => r.routeName)
              .join(', ');

            analysis = `Policy Recommendations:

ACE Performance:
- ${aceRoutes.length} routes with ACE coverage show average ${aceSpeedAvg.toFixed(1)}% speed improvement
- ${nonAceRoutes.length} routes without ACE show average ${nonAceSpeedAvg.toFixed(1)}% speed change

Priority Actions:
1. Expand ACE to ${highImpactRoutes || 'identified high-impact routes'} (high student impact routes)
2. Address exempt vehicle patterns in ${hotspotNames || 'key hotspots to be identified'}
3. Monitor congestion pricing impact on CBD routes: ${cbdFocus || 'designated CBD corridors'}`;
            break;
          }
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
