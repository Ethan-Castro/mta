export type RouteComparison = {
  routeId: string;
  routeName: string;
  campus: string;
  campusType: string;
  aceEnforced: boolean;
  averageWeekdayStudents: number;
  studentShare: number;
  averageSpeedBefore: number;
  averageSpeedAfter: number;
  speedChangePct: number;
  averageMonthlyViolations: number;
  exemptSharePct: number;
  congestionZone: boolean;
  narrative: string;
};

export const ROUTE_COMPARISONS: RouteComparison[] = [
  {
    routeId: "M15-SBS",
    routeName: "First/Second Ave SBS",
    campus: "Hunter College",
    campusType: "Senior College",
    aceEnforced: true,
    averageWeekdayStudents: 14800,
    studentShare: 0.36,
    averageSpeedBefore: 6.8,
    averageSpeedAfter: 8.2,
    speedChangePct: 20.6,
    averageMonthlyViolations: 1825,
    exemptSharePct: 14.1,
    congestionZone: true,
    narrative: "Flagship Manhattan corridor with strong ACE gains after 2022 camera deployment and congestion pricing pilot.",
  },
  {
    routeId: "Bx12-SBS",
    routeName: "Fordham-Pelham SBS",
    campus: "Lehman College",
    campusType: "Senior College",
    aceEnforced: true,
    averageWeekdayStudents: 11950,
    studentShare: 0.42,
    averageSpeedBefore: 9.4,
    averageSpeedAfter: 10.9,
    speedChangePct: 16.0,
    averageMonthlyViolations: 940,
    exemptSharePct: 18.7,
    congestionZone: false,
    narrative: "Crosstown Bronx trunk serving Lehman and Fordham; ACE reduces double parking delays but exempt logistics fleets remain concentrated at Fordham Plaza.",
  },
  {
    routeId: "Q46",
    routeName: "Union Turnpike",
    campus: "Queens College",
    campusType: "Senior College",
    aceEnforced: false,
    averageWeekdayStudents: 9100,
    studentShare: 0.51,
    averageSpeedBefore: 8.7,
    averageSpeedAfter: 8.3,
    speedChangePct: -4.6,
    averageMonthlyViolations: 310,
    exemptSharePct: 8.9,
    congestionZone: false,
    narrative: "High student share but no ACE enforcement. Speed decline aligns with growth in exempt contractor vehicles around Kissena Blvd campus entrances.",
  },
  {
    routeId: "B44-SBS",
    routeName: "Nostrand-Rogers SBS",
    campus: "Brooklyn College",
    campusType: "Senior College",
    aceEnforced: true,
    averageWeekdayStudents: 13200,
    studentShare: 0.34,
    averageSpeedBefore: 7.5,
    averageSpeedAfter: 8.7,
    speedChangePct: 16.0,
    averageMonthlyViolations: 1260,
    exemptSharePct: 12.4,
    congestionZone: false,
    narrative: "Southern Brooklyn ACE corridor tying Flatbush campuses together; consistent reliability gains after weekend enforcement expansion.",
  },
  {
    routeId: "S79-SBS",
    routeName: "Staten Island - Brooklyn SBS",
    campus: "College of Staten Island",
    campusType: "Comprehensive College",
    aceEnforced: true,
    averageWeekdayStudents: 5300,
    studentShare: 0.44,
    averageSpeedBefore: 13.2,
    averageSpeedAfter: 14.6,
    speedChangePct: 10.6,
    averageMonthlyViolations: 410,
    exemptSharePct: 21.0,
    congestionZone: true,
    narrative: "Bridge approach enforcement remains limited; exempt logistics deliveries spike near the St. George terminal during ferry peaks.",
  },
];

export type ViolationHotspot = {
  id: string;
  routeId: string;
  campus: string;
  location: string;
  latitude: number;
  longitude: number;
  averageDailyViolations: number;
  exemptSharePct: number;
  recurringVehicles: number;
  highlight: string;
};

export const VIOLATION_HOTSPOTS: ViolationHotspot[] = [
  {
    id: "m15-57th",
    routeId: "M15-SBS",
    campus: "Hunter College",
    location: "E 57 St & 3rd Ave",
    latitude: 40.759094,
    longitude: -73.969559,
    averageDailyViolations: 64,
    exemptSharePct: 27.0,
    recurringVehicles: 19,
    highlight: "High exempt share from commercial loading zones overlapping with SBS stop; monitor curb regulation compliance.",
  },
  {
    id: "bx12-fordham",
    routeId: "Bx12-SBS",
    campus: "Lehman College",
    location: "Fordham Rd & Jerome Ave",
    latitude: 40.862767,
    longitude: -73.901118,
    averageDailyViolations: 41,
    exemptSharePct: 33.0,
    recurringVehicles: 11,
    highlight: "Repeat exempt utility vans hold curb during evening class dismissals; coordinate with NYPD traffic agents.",
  },
  {
    id: "q46-kissena",
    routeId: "Q46",
    campus: "Queens College",
    location: "Kissena Blvd & Melbourne Ave",
    latitude: 40.736968,
    longitude: -73.819412,
    averageDailyViolations: 28,
    exemptSharePct: 12.0,
    recurringVehicles: 7,
    highlight: "No ACE coverage; consider mobile camera pilot tied to evening shuttle arrivals.",
  },
  {
    id: "b44-flatbush",
    routeId: "B44-SBS",
    campus: "Brooklyn College",
    location: "Flatbush Ave & Nostrand Junction",
    latitude: 40.632881,
    longitude: -73.947632,
    averageDailyViolations: 46,
    exemptSharePct: 17.0,
    recurringVehicles: 13,
    highlight: "Bus-only left turns conflict with delivery vehicles; align traffic signal priority with enforcement cadence.",
  },
  {
    id: "s79-bay",
    routeId: "S79-SBS",
    campus: "College of Staten Island",
    location: "Hylan Blvd & Bay St",
    latitude: 40.643045,
    longitude: -74.074094,
    averageDailyViolations: 22,
    exemptSharePct: 38.0,
    recurringVehicles: 9,
    highlight: "Exempt ferry vendor vehicles spike during PM peak; explore shared loading windows with DOT curb team.",
  },
];

export type ExemptRepeater = {
  vehicleId: string;
  company: string;
  primaryReason: string;
  violations: number;
  routes: string[];
  hotspots: string[];
  nextAction: string;
};

export const EXEMPT_REPEATERS: ExemptRepeater[] = [
  {
    vehicleId: "6F1C-FA7",
    company: "Metro Logistics",
    primaryReason: "Essential deliveries",
    violations: 128,
    routes: ["M15-SBS", "Bx12-SBS"],
    hotspots: ["E 57 St & 3rd Ave", "Fordham Rd & Jerome Ave"],
    nextAction: "Schedule curb coordination meeting; pilot timed loading permits tied to ACE alerts.",
  },
  {
    vehicleId: "8BD2-9C3",
    company: "Campus Facilities Vendor",
    primaryReason: "City contract",
    violations: 76,
    routes: ["Q46"],
    hotspots: ["Kissena Blvd & Melbourne Ave"],
    nextAction: "Require alternate staging area on Reeves Ave; trigger enforcement blitz during finals week.",
  },
  {
    vehicleId: "44A1-1DX",
    company: "Cable Utility Fleet",
    primaryReason: "Utility work",
    violations: 69,
    routes: ["B44-SBS", "S79-SBS"],
    hotspots: ["Flatbush Ave & Nostrand Junction", "Hylan Blvd & Bay St"],
    nextAction: "Integrate work orders with ACE geofences to auto-approve limited windows and flag overages.",
  },
];

export type CbdRouteTrend = {
  routeId: string;
  routeName: string;
  boroughs: string;
  crossesCbd: boolean;
  aceGoLive: string;
  prePricingViolations: number;
  postPricingViolations: number;
  violationChangePct: number;
  prePricingAverageSpeed: number;
  postPricingAverageSpeed: number;
  speedChangePct: number;
  latitude: number;
  longitude: number;
  highlight: string;
};

export const CBD_ROUTE_TRENDS: CbdRouteTrend[] = [
  {
    routeId: "M15-SBS",
    routeName: "First/Second Ave SBS",
    boroughs: "Manhattan",
    crossesCbd: true,
    aceGoLive: "2022-09-01",
    prePricingViolations: 2550,
    postPricingViolations: 1810,
    violationChangePct: -28.9,
    prePricingAverageSpeed: 6.8,
    postPricingAverageSpeed: 8.2,
    speedChangePct: 20.6,
    latitude: 40.752644,
    longitude: -73.969,
    highlight: "Congestion pricing and ACE coordination trimmed violations near 34th St and unlocked +1.4 mph travel speed gains.",
  },
  {
    routeId: "M103",
    routeName: "Third/Lexington Ave",
    boroughs: "Manhattan",
    crossesCbd: true,
    aceGoLive: "2023-02-15",
    prePricingViolations: 920,
    postPricingViolations: 740,
    violationChangePct: -19.6,
    prePricingAverageSpeed: 6.1,
    postPricingAverageSpeed: 6.9,
    speedChangePct: 13.1,
    latitude: 40.733851,
    longitude: -73.986274,
    highlight: "Camera zones south of Houston St show sustained reductions but midtown loading zones still see exempt spikes.",
  },
  {
    routeId: "BxM1",
    routeName: "Riverdale - East Midtown",
    boroughs: "Bronx/Manhattan",
    crossesCbd: true,
    aceGoLive: "2021-11-04",
    prePricingViolations: 310,
    postPricingViolations: 260,
    violationChangePct: -16.1,
    prePricingAverageSpeed: 11.4,
    postPricingAverageSpeed: 12.2,
    speedChangePct: 7.0,
    latitude: 40.758252,
    longitude: -73.972854,
    highlight: "Premium commuter route still benefits from congestion tolling; riders report more reliable 57th St arrivals.",
  },
  {
    routeId: "Q46",
    routeName: "Union Turnpike",
    boroughs: "Queens",
    crossesCbd: false,
    aceGoLive: "Not deployed",
    prePricingViolations: 310,
    postPricingViolations: 345,
    violationChangePct: 11.3,
    prePricingAverageSpeed: 8.7,
    postPricingAverageSpeed: 8.3,
    speedChangePct: -4.6,
    latitude: 40.736316,
    longitude: -73.820035,
    highlight: "Queens College connector shows why non-CBD routes still need ACE expansion to keep campus lanes clear.",
  },
];

export const DOCUMENTATION_LINKS = [
  {
    title: "ACE Program Overview",
    href: "https://new.mta.info/project/ace",
    summary: "What automated camera enforcement covers, deployment schedule, and enforcement criteria.",
  },
  {
    title: "Bus Lane Rules (NYC DOT)",
    href: "https://www.nyc.gov/html/dot/html/motorist/bus-lane.shtml",
    summary: "City rules governing curb access, violations, and exemptions for bus lanes.",
  },
  {
    title: "Congestion Pricing Final Rule",
    href: "https://congestion-pricing-plan-nyc.com",
    summary: "Pricing boundaries, implementation timeline, and metrics to track in the CBD.",
  },
  {
    title: "ACE Violations Dataset",
    href: "https://data.ny.gov/Transportation/Automated-Bus-Lane-Enforcement-Violations/kh8p-hcbm",
    summary: "Primary dataset powering violation analysis and repeat offender tracking.",
  },
  {
    title: "CUNY Enrollment by Campus",
    href: "https://www.cuny.edu/about/administration/offices/oira/institutional/data/book/current-student-data-book/",
    summary: "Student counts to estimate campus demand across routes.",
  },
];

export const AI_STARTER_PROMPTS = [
  "Compare ACE speed gains for M15-SBS vs Q46 and flag confidence intervals",
  "List exempt vehicles with more than 20 violations near Queens College in the last quarter",
  "Generate congestion pricing before/after charts for routes crossing 60th Street",
  "Simulate violation volume on B44-SBS if exempt share falls below 10%",
  "Draft daily briefing template for ACE operations analysts",
];

export const ANALYST_SCENARIOS = [
  {
    title: "Campus Route Health Check",
    description: "Summarize utilization, speed change, and violation pressure for a selected campus shuttle corridor.",
    expectedInputs: "route_id, start_ts, end_ts",
    playbook: "1) Pull ACE violations grouped by month; 2) Join to AVL speed data; 3) Compare against enrollment peaks; 4) Recommend curb interventions.",
  },
  {
    title: "Exempt Vehicle Audit",
    description: "Find repeat exempt fleets and quantify dwell time hotspots.",
    expectedInputs: "vehicle_id, reason_code, route_id",
    playbook: "1) Filter ACE violations where violation_status='Exempt'; 2) Rank vehicles by occurrences; 3) Map hotspots; 4) Output escalation memo.",
  },
  {
    title: "CBD Congestion Pulse",
    description: "Measure violation shifts for CBD routes post pricing go-live and estimate speed elasticity.",
    expectedInputs: "route_id[], date_range",
    playbook: "1) Compare mean violations pre/post; 2) Pull MTA bus time speeds; 3) Regress speed on violation rate; 4) Surface recommended toll adjustments.",
  },
];
