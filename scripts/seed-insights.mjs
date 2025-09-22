import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

async function loadJson(filename) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filePath = path.resolve(__dirname, '..', 'data', 'seed', filename);
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or equivalent env var is required');
  }

  const sql = neon(connectionString);

  await sql`create table if not exists route_insights (
    route_id text primary key,
    route_name text not null,
    campus text not null,
    campus_type text not null,
    ace_enforced boolean not null,
    average_weekday_students integer not null,
    student_share double precision not null,
    average_speed_before double precision,
    average_speed_after double precision,
    speed_change_pct double precision,
    average_monthly_violations double precision,
    exempt_share_pct double precision,
    congestion_zone boolean not null default false,
    narrative text
  )`;

  await sql`create table if not exists violation_hotspots_curated (
    id text primary key,
    route_id text not null,
    campus text,
    location text,
    latitude double precision not null,
    longitude double precision not null,
    average_daily_violations integer,
    exempt_share_pct double precision,
    recurring_vehicles integer,
    highlight text
  )`;

  await sql`create table if not exists exempt_repeaters_curated (
    vehicle_id text primary key,
    company text,
    primary_reason text,
    violations integer,
    routes text[] default '{}',
    hotspots text[] default '{}',
    next_action text
  )`;

  await sql`create table if not exists cbd_route_trends (
    route_id text primary key,
    route_name text not null,
    boroughs text not null,
    crosses_cbd boolean not null,
    ace_go_live text,
    pre_pricing_violations integer,
    post_pricing_violations integer,
    violation_change_pct double precision,
    pre_pricing_average_speed double precision,
    post_pricing_average_speed double precision,
    speed_change_pct double precision,
    latitude double precision,
    longitude double precision,
    highlight text
  )`;

  await sql`create table if not exists documentation_links (
    id serial primary key,
    title text not null,
    href text not null unique,
    summary text
  )`;

  await sql`create table if not exists ai_prompts (
    id serial primary key,
    category text not null,
    prompt text not null unique
  )`;

  await sql`create table if not exists analyst_scenarios (
    id serial primary key,
    title text not null unique,
    description text not null,
    expected_inputs text,
    playbook text
  )`;

  await sql`create table if not exists student_commute_profiles (
    campus text primary key,
    campus_type text not null,
    borough text not null,
    avg_daily_students integer not null,
    ace_coverage_share double precision not null,
    primary_route jsonb not null,
    comparison_route jsonb not null,
    non_ace_route jsonb not null,
    travel_time_delta text not null,
    hotspot_ids text[] not null,
    timeline jsonb not null,
    recommendation text not null,
    student_voices text[] not null
  )`;

  await sql`create table if not exists student_db_recipes (
    id serial primary key,
    title text not null unique,
    description text,
    sql text not null
  )`;

  await sql`create table if not exists sql_tool_recipes (
    topic text primary key,
    sql text not null
  )`;

  const routeInsights = await loadJson('route-insights.json');
  for (const row of routeInsights) {
    await sql`
      insert into route_insights (
        route_id, route_name, campus, campus_type, ace_enforced, average_weekday_students, student_share,
        average_speed_before, average_speed_after, speed_change_pct, average_monthly_violations, exempt_share_pct,
        congestion_zone, narrative
      ) values (
        ${row.routeId}, ${row.routeName}, ${row.campus}, ${row.campusType}, ${row.aceEnforced}, ${row.averageWeekdayStudents},
        ${row.studentShare}, ${row.averageSpeedBefore}, ${row.averageSpeedAfter}, ${row.speedChangePct},
        ${row.averageMonthlyViolations}, ${row.exemptSharePct}, ${row.congestionZone}, ${row.narrative}
      )
      on conflict (route_id) do update set
        route_name = excluded.route_name,
        campus = excluded.campus,
        campus_type = excluded.campus_type,
        ace_enforced = excluded.ace_enforced,
        average_weekday_students = excluded.average_weekday_students,
        student_share = excluded.student_share,
        average_speed_before = excluded.average_speed_before,
        average_speed_after = excluded.average_speed_after,
        speed_change_pct = excluded.speed_change_pct,
        average_monthly_violations = excluded.average_monthly_violations,
        exempt_share_pct = excluded.exempt_share_pct,
        congestion_zone = excluded.congestion_zone,
        narrative = excluded.narrative
    `;
  }

  const hotspots = await loadJson('violation-hotspots.json');
  for (const row of hotspots) {
    await sql`
      insert into violation_hotspots_curated (
        id, route_id, campus, location, latitude, longitude, average_daily_violations,
        exempt_share_pct, recurring_vehicles, highlight
      ) values (
        ${row.id}, ${row.routeId}, ${row.campus}, ${row.location}, ${row.latitude}, ${row.longitude},
        ${row.averageDailyViolations}, ${row.exemptSharePct}, ${row.recurringVehicles}, ${row.highlight}
      )
      on conflict (id) do update set
        route_id = excluded.route_id,
        campus = excluded.campus,
        location = excluded.location,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        average_daily_violations = excluded.average_daily_violations,
        exempt_share_pct = excluded.exempt_share_pct,
        recurring_vehicles = excluded.recurring_vehicles,
        highlight = excluded.highlight
    `;
  }

  const repeaters = await loadJson('exempt-repeaters.json');
  for (const row of repeaters) {
    await sql`
      insert into exempt_repeaters_curated (
        vehicle_id, company, primary_reason, violations, routes, hotspots, next_action
      ) values (
        ${row.vehicleId}, ${row.company}, ${row.primaryReason}, ${row.violations}, ${row.routes}::text[],
        ${row.hotspots}::text[], ${row.nextAction}
      )
      on conflict (vehicle_id) do update set
        company = excluded.company,
        primary_reason = excluded.primary_reason,
        violations = excluded.violations,
        routes = excluded.routes,
        hotspots = excluded.hotspots,
        next_action = excluded.next_action
    `;
  }

  const cbdRoutes = await loadJson('cbd-route-trends.json');
  for (const row of cbdRoutes) {
    await sql`
      insert into cbd_route_trends (
        route_id, route_name, boroughs, crosses_cbd, ace_go_live, pre_pricing_violations,
        post_pricing_violations, violation_change_pct, pre_pricing_average_speed, post_pricing_average_speed,
        speed_change_pct, latitude, longitude, highlight
      ) values (
        ${row.routeId}, ${row.routeName}, ${row.boroughs}, ${row.crossesCbd}, ${row.aceGoLive},
        ${row.prePricingViolations}, ${row.postPricingViolations}, ${row.violationChangePct},
        ${row.prePricingAverageSpeed}, ${row.postPricingAverageSpeed}, ${row.speedChangePct},
        ${row.latitude}, ${row.longitude}, ${row.highlight}
      )
      on conflict (route_id) do update set
        route_name = excluded.route_name,
        boroughs = excluded.boroughs,
        crosses_cbd = excluded.crosses_cbd,
        ace_go_live = excluded.ace_go_live,
        pre_pricing_violations = excluded.pre_pricing_violations,
        post_pricing_violations = excluded.post_pricing_violations,
        violation_change_pct = excluded.violation_change_pct,
        pre_pricing_average_speed = excluded.pre_pricing_average_speed,
        post_pricing_average_speed = excluded.post_pricing_average_speed,
        speed_change_pct = excluded.speed_change_pct,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        highlight = excluded.highlight
    `;
  }

  const docs = await loadJson('documentation-links.json');
  for (const row of docs) {
    await sql`
      insert into documentation_links (title, href, summary)
      values (${row.title}, ${row.href}, ${row.summary})
      on conflict (href) do update set
        title = excluded.title,
        summary = excluded.summary
    `;
  }

  const prompts = await loadJson('ai-prompts.json');
  for (const row of prompts) {
    await sql`
      insert into ai_prompts (category, prompt)
      values (${row.category}, ${row.prompt})
      on conflict (prompt) do update set
        category = excluded.category
    `;
  }

  const scenarios = await loadJson('analyst-scenarios.json');
  for (const row of scenarios) {
    await sql`
      insert into analyst_scenarios (title, description, expected_inputs, playbook)
      values (${row.title}, ${row.description}, ${row.expectedInputs}, ${row.playbook})
      on conflict (title) do update set
        description = excluded.description,
        expected_inputs = excluded.expected_inputs,
        playbook = excluded.playbook
    `;
  }

  const studentProfiles = await loadJson('student-commute-profiles.json');
  for (const row of studentProfiles) {
    await sql`
      insert into student_commute_profiles (
        campus, campus_type, borough, avg_daily_students, ace_coverage_share,
        primary_route, comparison_route, non_ace_route, travel_time_delta, hotspot_ids,
        timeline, recommendation, student_voices
      ) values (
        ${row.campus}, ${row.campusType}, ${row.borough}, ${row.avgDailyStudents}, ${row.aceCoverageShare},
        ${JSON.stringify(row.primaryRoute)}::jsonb, ${JSON.stringify(row.comparisonRoute)}::jsonb,
        ${JSON.stringify(row.nonAceRoute)}::jsonb,
        ${row.travelTimeDelta}, ${row.hotspotIds}::text[], ${JSON.stringify(row.timeline)}::jsonb,
        ${row.recommendation}, ${row.studentVoices}::text[]
      )
      on conflict (campus) do update set
        campus_type = excluded.campus_type,
        borough = excluded.borough,
        avg_daily_students = excluded.avg_daily_students,
        ace_coverage_share = excluded.ace_coverage_share,
        primary_route = excluded.primary_route,
        comparison_route = excluded.comparison_route,
        non_ace_route = excluded.non_ace_route,
        travel_time_delta = excluded.travel_time_delta,
        hotspot_ids = excluded.hotspot_ids,
        timeline = excluded.timeline,
        recommendation = excluded.recommendation,
        student_voices = excluded.student_voices
    `;
  }

  const recipes = await loadJson('student-db-recipes.json');
  for (const row of recipes) {
    await sql`
      insert into student_db_recipes (title, description, sql)
      values (${row.title}, ${row.description}, ${row.sql})
      on conflict (title) do update set
        description = excluded.description,
        sql = excluded.sql
    `;
  }

  const sqlRecipes = await loadJson('sql-tool-recipes.json');
  for (const row of sqlRecipes) {
    await sql`
      insert into sql_tool_recipes (topic, sql)
      values (${row.topic}, ${row.sql})
      on conflict (topic) do update set
        sql = excluded.sql
    `;
  }

  console.log('Seed completed successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
