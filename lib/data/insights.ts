import { sql, isDbConfigured } from "@/lib/db";

export type RouteComparison = {
  routeId: string;
  routeName: string;
  campus: string;
  campusType: string;
  aceEnforced: boolean;
  averageWeekdayStudents: number;
  studentShare: number;
  averageSpeedBefore: number | null;
  averageSpeedAfter: number | null;
  speedChangePct: number | null;
  averageMonthlyViolations: number | null;
  exemptSharePct: number | null;
  congestionZone: boolean;
  narrative: string | null;
};

export type ViolationHotspot = {
  id: string;
  routeId: string;
  campus: string | null;
  location: string | null;
  latitude: number;
  longitude: number;
  averageDailyViolations: number | null;
  exemptSharePct: number | null;
  recurringVehicles: number | null;
  highlight: string | null;
};

export type ExemptRepeater = {
  vehicleId: string;
  company: string | null;
  primaryReason: string | null;
  violations: number | null;
  routes: string[];
  hotspots: string[];
  nextAction: string | null;
};

export type CbdRouteTrend = {
  routeId: string;
  routeName: string;
  boroughs: string;
  crossesCbd: boolean;
  aceGoLive: string | null;
  prePricingViolations: number | null;
  postPricingViolations: number | null;
  violationChangePct: number | null;
  prePricingAverageSpeed: number | null;
  postPricingAverageSpeed: number | null;
  speedChangePct: number | null;
  latitude: number | null;
  longitude: number | null;
  highlight: string | null;
};

export type DocumentationLink = {
  id: number;
  title: string;
  href: string;
  summary: string | null;
};

export type AiPrompt = {
  id: number;
  category: string;
  prompt: string;
};

export type AnalystScenario = {
  id: number;
  title: string;
  description: string;
  expectedInputs: string | null;
  playbook: string | null;
};

type StudentRoute = {
  id: string;
  name: string;
  aceEnforced: boolean;
  speedChangePct: number;
  averageRideMinutes?: number;
  reliabilityScore?: string;
  note?: string;
};

type StudentTimelineEntry = {
  label: string;
  detail: string;
};

export type StudentCommuteProfile = {
  campus: string;
  campusType: string;
  borough: string;
  avgDailyStudents: number;
  aceCoverageShare: number;
  primaryRoute: StudentRoute;
  comparisonRoute: StudentRoute;
  nonAceRoute: StudentRoute;
  travelTimeDelta: string;
  hotspotIds: string[];
  timeline: StudentTimelineEntry[];
  recommendation: string;
  studentVoices: string[];
};

export type StudentDbRecipe = {
  id: number;
  title: string;
  description: string | null;
  sql: string;
};

export type SqlToolRecipe = {
  topic: string;
  sql: string;
};

export async function getRouteComparisons(): Promise<RouteComparison[]> {
  if (!isDbConfigured) {
    return [
      {
        routeId: "M15",
        routeName: "M15",
        campus: "Baruch College",
        campusType: "Senior College",
        aceEnforced: true,
        averageWeekdayStudents: 1250,
        studentShare: 0.15,
        averageSpeedBefore: 12.5,
        averageSpeedAfter: 14.2,
        speedChangePct: 13.6,
        averageMonthlyViolations: 45,
        exemptSharePct: 23.5,
        congestionZone: true,
        narrative: "Route shows significant improvement after ACE implementation",
      },
      {
        routeId: "B41",
        routeName: "B41",
        campus: "Brooklyn College",
        campusType: "Senior College",
        aceEnforced: true,
        averageWeekdayStudents: 890,
        studentShare: 0.12,
        averageSpeedBefore: 11.8,
        averageSpeedAfter: 13.1,
        speedChangePct: 11.0,
        averageMonthlyViolations: 32,
        exemptSharePct: 18.2,
        congestionZone: false,
        narrative: "Consistent performance with moderate violations",
      },
    ];
  }

  const rows = await sql`
    select
      route_id,
      route_name,
      campus,
      campus_type,
      ace_enforced,
      average_weekday_students,
      student_share,
      average_speed_before,
      average_speed_after,
      speed_change_pct,
      average_monthly_violations,
      exempt_share_pct,
      congestion_zone,
      narrative
    from route_insights
    order by route_name
  `;

  return (rows as Array<{ [key: string]: any }>).map((row) => ({
    routeId: row.route_id,
    routeName: row.route_name,
    campus: row.campus,
    campusType: row.campus_type,
    aceEnforced: Boolean(row.ace_enforced),
    averageWeekdayStudents: Number(row.average_weekday_students ?? 0),
    studentShare: Number(row.student_share ?? 0),
    averageSpeedBefore: row.average_speed_before !== null ? Number(row.average_speed_before) : null,
    averageSpeedAfter: row.average_speed_after !== null ? Number(row.average_speed_after) : null,
    speedChangePct: row.speed_change_pct !== null ? Number(row.speed_change_pct) : null,
    averageMonthlyViolations:
      row.average_monthly_violations !== null ? Number(row.average_monthly_violations) : null,
    exemptSharePct: row.exempt_share_pct !== null ? Number(row.exempt_share_pct) : null,
    congestionZone: Boolean(row.congestion_zone),
    narrative: row.narrative,
  }));
}

export async function getCuratedHotspots(): Promise<ViolationHotspot[]> {
  if (!isDbConfigured) {
    return [
      {
        id: "hotspot-1",
        routeId: "M15",
        campus: "Baruch College",
        location: "23rd St & Lexington Ave",
        latitude: 40.7385,
        longitude: -73.9857,
        averageDailyViolations: 8.5,
        exemptSharePct: 22.1,
        recurringVehicles: 12,
        highlight: "High violation rate during peak hours",
      },
    ];
  }

  const rows = await sql`
    select
      id,
      route_id,
      campus,
      location,
      latitude,
      longitude,
      average_daily_violations,
      exempt_share_pct,
      recurring_vehicles,
      highlight
    from violation_hotspots_curated
    order by average_daily_violations desc nulls last
  `;

  return (rows as Array<{ [key: string]: any }>).map((row) => ({
    id: row.id,
    routeId: row.route_id,
    campus: row.campus,
    location: row.location,
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    averageDailyViolations: row.average_daily_violations !== null ? Number(row.average_daily_violations) : null,
    exemptSharePct: row.exempt_share_pct !== null ? Number(row.exempt_share_pct) : null,
    recurringVehicles: row.recurring_vehicles !== null ? Number(row.recurring_vehicles) : null,
    highlight: row.highlight,
  }));
}

export async function getExemptRepeaterSummaries(): Promise<ExemptRepeater[]> {
  if (!isDbConfigured) {
    return [
      {
        vehicleId: "V12345",
        company: "Transit Corp",
        primaryReason: "Emergency vehicle",
        violations: 15,
        routes: ["M15", "M23"],
        hotspots: ["23rd St & Lexington"],
        nextAction: "Review exemption status",
      },
    ];
  }

  const rows = await sql`
    select
      vehicle_id,
      company,
      primary_reason,
      violations,
      routes,
      hotspots,
      next_action
    from exempt_repeaters_curated
    order by violations desc nulls last
  `;

  return (rows as Array<{ [key: string]: any }>).map((row) => ({
    vehicleId: row.vehicle_id,
    company: row.company,
    primaryReason: row.primary_reason,
    violations: row.violations !== null ? Number(row.violations) : null,
    routes: Array.isArray(row.routes) ? row.routes : [],
    hotspots: Array.isArray(row.hotspots) ? row.hotspots : [],
    nextAction: row.next_action,
  }));
}

export async function getCbdRouteTrends(): Promise<CbdRouteTrend[]> {
  if (!isDbConfigured) {
    return [
      {
        routeId: "M15",
        routeName: "M15",
        boroughs: "Manhattan",
        crossesCbd: true,
        aceGoLive: "2024-01-01",
        prePricingViolations: 125,
        postPricingViolations: 78,
        violationChangePct: -37.6,
        prePricingAverageSpeed: 11.2,
        postPricingAverageSpeed: 13.8,
        speedChangePct: 23.2,
        latitude: 40.7385,
        longitude: -73.9857,
        highlight: "Significant improvement in CBD area",
      },
    ];
  }

  const rows = await sql`
    select
      route_id,
      route_name,
      boroughs,
      crosses_cbd,
      ace_go_live,
      pre_pricing_violations,
      post_pricing_violations,
      violation_change_pct,
      pre_pricing_average_speed,
      post_pricing_average_speed,
      speed_change_pct,
      latitude,
      longitude,
      highlight
    from cbd_route_trends
    order by route_name
  `;

  return (rows as Array<{ [key: string]: any }>).map((row) => ({
    routeId: row.route_id,
    routeName: row.route_name,
    boroughs: row.boroughs,
    crossesCbd: Boolean(row.crosses_cbd),
    aceGoLive: row.ace_go_live,
    prePricingViolations: row.pre_pricing_violations !== null ? Number(row.pre_pricing_violations) : null,
    postPricingViolations: row.post_pricing_violations !== null ? Number(row.post_pricing_violations) : null,
    violationChangePct: row.violation_change_pct !== null ? Number(row.violation_change_pct) : null,
    prePricingAverageSpeed:
      row.pre_pricing_average_speed !== null ? Number(row.pre_pricing_average_speed) : null,
    postPricingAverageSpeed:
      row.post_pricing_average_speed !== null ? Number(row.post_pricing_average_speed) : null,
    speedChangePct: row.speed_change_pct !== null ? Number(row.speed_change_pct) : null,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    highlight: row.highlight,
  }));
}

export async function getDocumentationLinks(): Promise<DocumentationLink[]> {
  if (!isDbConfigured) {
    return [
      {
        id: 1,
        title: "ACE Program Overview",
        href: "https://www.nyc.gov/html/dot/html/about/automated-bus-lane-enforcement.shtml",
        summary: "Official MTA documentation on ACE program",
      },
    ];
  }

  const rows = await sql`
    select id, title, href, summary
    from documentation_links
    order by id asc
  `;

  return (rows as Array<{ [key: string]: any }>).map((row) => ({
    id: Number(row.id),
    title: row.title,
    href: row.href,
    summary: row.summary,
  }));
}

export async function getAiPrompts(category?: string): Promise<AiPrompt[]> {
  const rows = category
    ? await sql`select id, category, prompt from ai_prompts where lower(category) = lower(${category}) order by id`
    : await sql`select id, category, prompt from ai_prompts order by id`;

  return (rows as Array<{ [key: string]: any }>).map((row) => ({
    id: Number(row.id),
    category: row.category,
    prompt: row.prompt,
  }));
}

export async function getAnalystScenarios(): Promise<AnalystScenario[]> {
  if (!isDbConfigured) {
    return [
      {
        id: 1,
        title: "Route Performance Analysis",
        description: "Analyze M15 route performance before and after ACE implementation",
        expectedInputs: "Route ID, date range",
        playbook: "1. Query route_insights table 2. Compare before/after metrics 3. Analyze trends",
      },
    ];
  }

  const rows = await sql`
    select id, title, description, expected_inputs, playbook
    from analyst_scenarios
    order by id
  `;

  return (rows as Array<{ [key: string]: any }>).map((row) => ({
    id: Number(row.id),
    title: row.title,
    description: row.description,
    expectedInputs: row.expected_inputs,
    playbook: row.playbook,
  }));
}

export async function getStudentCommuteProfiles(): Promise<StudentCommuteProfile[]> {
  if (!isDbConfigured) {
    return [
      {
        campus: "Baruch College",
        campusType: "Senior College",
        borough: "Manhattan",
        avgDailyStudents: 18500,
        aceCoverageShare: 0.85,
        primaryRoute: {
          id: "M15",
          name: "M15",
          aceEnforced: true,
          speedChangePct: 13.6,
          averageRideMinutes: 45,
          reliabilityScore: "Good",
          note: "Primary route for Baruch students",
        },
        comparisonRoute: {
          id: "M23",
          name: "M23",
          aceEnforced: false,
          speedChangePct: 0,
          averageRideMinutes: 52,
          reliabilityScore: "Fair",
          note: "Alternative route",
        },
        nonAceRoute: {
          id: "M101",
          name: "M101",
          aceEnforced: false,
          speedChangePct: 0,
          averageRideMinutes: 58,
          reliabilityScore: "Poor",
          note: "Non-ACE route for comparison",
        },
        travelTimeDelta: "13 minutes faster with ACE",
        hotspotIds: ["hotspot-1"],
        timeline: [
          { label: "2023", detail: "Pre-ACE implementation" },
          { label: "2024", detail: "ACE enforcement begins" },
        ],
        recommendation: "Continue ACE enforcement on M15",
        studentVoices: ["Much faster commute now", "Reliable service"],
      },
    ];
  }

  const rows = await sql`
    select
      campus,
      campus_type,
      borough,
      avg_daily_students,
      ace_coverage_share,
      primary_route,
      comparison_route,
      non_ace_route,
      travel_time_delta,
      hotspot_ids,
      timeline,
      recommendation,
      student_voices
    from student_commute_profiles
    order by campus
  `;

  return (rows as Array<{ [key: string]: any }>).map((row) => ({
    campus: row.campus,
    campusType: row.campus_type,
    borough: row.borough,
    avgDailyStudents: Number(row.avg_daily_students ?? 0),
    aceCoverageShare: Number(row.ace_coverage_share ?? 0),
    primaryRoute: row.primary_route as StudentRoute,
    comparisonRoute: row.comparison_route as StudentRoute,
    nonAceRoute: row.non_ace_route as StudentRoute,
    travelTimeDelta: row.travel_time_delta,
    hotspotIds: Array.isArray(row.hotspot_ids) ? row.hotspot_ids : [],
    timeline: Array.isArray(row.timeline) ? (row.timeline as StudentTimelineEntry[]) : [],
    recommendation: row.recommendation,
    studentVoices: Array.isArray(row.student_voices) ? row.student_voices : [],
  }));
}

export async function getStudentDbRecipes(): Promise<StudentDbRecipe[]> {
  if (!isDbConfigured) {
    return [
      {
        id: 1,
        title: "Student Route Analysis",
        description: "Analyze student ridership patterns on specific routes",
        sql: "SELECT route_id, avg_students, peak_hours FROM student_commute_profiles WHERE campus = 'Baruch College'",
      },
    ];
  }

  const rows = await sql`
    select id, title, description, sql
    from student_db_recipes
    order by id
  `;

  return (rows as Array<{ [key: string]: any }>).map((row) => ({
    id: Number(row.id),
    title: row.title,
    description: row.description,
    sql: row.sql,
  }));
}

export async function getSqlToolRecipes(): Promise<SqlToolRecipe[]> {
  if (!isDbConfigured) {
    return [
      {
        topic: "Route Performance",
        sql: "SELECT route_id, avg_speed_before, avg_speed_after FROM route_insights WHERE campus = 'Baruch College'",
      },
    ];
  }

  const rows = await sql`
    select topic, sql
    from sql_tool_recipes
    order by topic
  `;

  return (rows as Array<{ [key: string]: any }>).map((row) => ({
    topic: row.topic,
    sql: row.sql,
  }));
}
