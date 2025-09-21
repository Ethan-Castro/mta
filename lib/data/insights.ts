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

export type StudentCommuteProfile = {
  campus: string;
  campusType: string;
  borough: string;
  avgDailyStudents: number;
  aceCoverageShare: number;
  primaryRoute: {
    id: string;
    name: string;
    aceEnforced: boolean;
    speedChangePct: number;
    averageRideMinutes: number;
    reliabilityScore: string;
  };
  comparisonRoute: {
    id: string;
    name: string;
    aceEnforced: boolean;
    speedChangePct: number;
    note: string;
  };
  nonAceRoute: {
    id: string;
    name: string;
    aceEnforced: boolean;
    speedChangePct: number;
    note: string;
  };
  travelTimeDelta: string;
  hotspotIds: string[];
  timeline: Array<{ label: string; detail: string }>;
  recommendation: string;
  studentVoices: string[];
};

export const STUDENT_COMMUTE_PROFILES: StudentCommuteProfile[] = [
  {
    campus: "Hunter College",
    campusType: "Senior College",
    borough: "Manhattan",
    avgDailyStudents: 14800,
    aceCoverageShare: 0.74,
    primaryRoute: {
      id: "M15-SBS",
      name: "First/Second Ave SBS",
      aceEnforced: true,
      speedChangePct: 20.6,
      averageRideMinutes: 28,
      reliabilityScore: "94% on-time",
    },
    comparisonRoute: {
      id: "M103",
      name: "Third/Lexington Ave Local",
      aceEnforced: true,
      speedChangePct: 13.1,
      note: "CBD local service, slower but resilient when SBS is disrupted",
    },
    nonAceRoute: {
      id: "Q46",
      name: "Union Turnpike",
      aceEnforced: false,
      speedChangePct: -4.6,
      note: "Outer-borough transfer showing need for camera expansion",
    },
    travelTimeDelta: "-5.4 min vs 2021 fall semester",
    hotspotIds: ["m15-57th"],
    timeline: [
      { label: "08:00", detail: "Northbound SBS skip-stop still clears 68th St in <6 min after ACE expansion." },
      { label: "12:30", detail: "Midday CBD loading zones require DOT coordination to keep curb space open." },
      { label: "18:15", detail: "Evening transfer to 6 train sees 12% more reliability compared to non-ACE routes." },
    ],
    recommendation: "Keep SBS lanes camera-protected and pilot congestion repricing credits for students traveling off-peak to spread demand.",
    studentVoices: [
      "“ACE cameras finally cleared double-parkers near 68th Street — my commute dropped by 7 minutes.”",
      "“Weeknight classes still suffer from delivery trucks; pairing ACE alerts with DOT inspectors would help.”",
    ],
  },
  {
    campus: "Queens College",
    campusType: "Senior College",
    borough: "Queens",
    avgDailyStudents: 9100,
    aceCoverageShare: 0.42,
    primaryRoute: {
      id: "Q46",
      name: "Union Turnpike",
      aceEnforced: false,
      speedChangePct: -4.6,
      averageRideMinutes: 34,
      reliabilityScore: "73% on-time",
    },
    comparisonRoute: {
      id: "QM5",
      name: "Queens Midtown Express",
      aceEnforced: true,
      speedChangePct: 8.4,
      note: "Express overlay shows benefits when dedicated lanes stay clear",
    },
    nonAceRoute: {
      id: "Q25",
      name: "Kissena Blvd Local",
      aceEnforced: false,
      speedChangePct: -6.8,
      note: "Local corridor with recurring exempt contractor vehicles",
    },
    travelTimeDelta: "+3.1 min vs 2021 fall semester",
    hotspotIds: ["q46-kissena"],
    timeline: [
      { label: "07:45", detail: "Queue jump lanes experience 22% slowdown without ACE coverage." },
      { label: "14:10", detail: "Campus construction deliveries trigger exempt spikes; route reliability dips." },
      { label: "21:00", detail: "Late-night departures rely on Q25 with minimal enforcement." },
    ],
    recommendation: "Prioritize mobile ACE deployment on Kissena Blvd and sync with campus loading schedules to protect student arrivals.",
    studentVoices: [
      "“Contractor vans take over the stop in front of Rosenthal Library almost every afternoon.”",
      "“Express buses are faster but limited; updated ACE coverage on Q46 would help commuters like me.”",
    ],
  },
  {
    campus: "Brooklyn College",
    campusType: "Senior College",
    borough: "Brooklyn",
    avgDailyStudents: 13200,
    aceCoverageShare: 0.66,
    primaryRoute: {
      id: "B44-SBS",
      name: "Nostrand/Rogers SBS",
      aceEnforced: true,
      speedChangePct: 16.0,
      averageRideMinutes: 31,
      reliabilityScore: "89% on-time",
    },
    comparisonRoute: {
      id: "B6",
      name: "Flatlands Ave Local",
      aceEnforced: false,
      speedChangePct: -3.2,
      note: "Local feeder into Flatbush with heavy double-parking",
    },
    nonAceRoute: {
      id: "B11",
      name: "46 St Crosstown",
      aceEnforced: false,
      speedChangePct: -1.9,
      note: "Important crosstown candidate for ACE expansion",
    },
    travelTimeDelta: "-4.1 min vs 2021 fall semester",
    hotspotIds: ["b44-flatbush"],
    timeline: [
      { label: "08:30", detail: "Inbound SBS maintains 8.7 mph through Nostrand Junction after ACE signage refresh." },
      { label: "15:45", detail: "Dismissal surge collides with delivery trucks; targeted enforcement every Thursday recommended." },
      { label: "23:05", detail: "Overnight service still sees exempt utility fleets near Junction — coordinate with DOT." },
    ],
    recommendation: "Extend weekend ACE enforcement windows and coordinate with delivery partners to stagger drop-offs near campus entrances.",
    studentVoices: [
      "“SBS keeps moving even when the local crawls — the cameras made a noticeable difference.”",
      "“Delivery trucks block the curb when night classes let out; we need shared loading windows.”",
    ],
  },
];

export const STUDENT_PROMPTS = [
  "For Hunter College, compare M15-SBS and M103 reliability during the morning peak and highlight curb conflicts.",
  "Generate an action plan to deploy mobile ACE coverage on Q46 near Queens College afternoon arrivals.",
  "Simulate Brooklyn College SBS travel times if B6 local lanes had 50% fewer exempt vehicles.",
  "Draft a student-facing bulletin summarizing congestion pricing benefits for CBD-bound routes.",
];

export type StudentDbRecipe = {
  title: string;
  description: string;
  sql: string;
};

export const STUDENT_DB_RECIPES: StudentDbRecipe[] = [
  {
    title: "Campus rider exposure by route",
    description: "Joins ACE violations with campus enrollment to size daily riders affected by curb activity.",
    sql: "SELECT bus_route_id, date_trunc('month', first_occurrence) AS month, COUNT(*) AS violations, SUM(CASE WHEN violation_status = 'Exempt' THEN 1 ELSE 0 END) AS exempt_count FROM ace_violations WHERE first_occurrence >= date_trunc('month', now()) - interval '12 months' GROUP BY 1,2 ORDER BY 2 DESC, 1;",
  },
  {
    title: "Repeat exempt vehicles near campuses",
    description: "Identifies exempt fleets stopping within 200 meters of CUNY campus bounding boxes.",
    sql: "WITH campus_buffers AS ( SELECT campus_id, ST_Buffer(geog, 200) AS buffer_geog FROM cuny_campuses ), campus_events AS ( SELECT v.vehicle_id, v.violation_status, v.first_occurrence, v.bus_route_id, c.campus_id FROM ace_violations v JOIN campus_buffers c ON ST_Intersects(v.geog, c.buffer_geog) WHERE v.violation_status = 'Exempt' ) SELECT campus_id, vehicle_id, COUNT(*) AS events, ARRAY_AGG(DISTINCT bus_route_id) AS routes FROM campus_events GROUP BY 1,2 HAVING COUNT(*) > 3 ORDER BY events DESC;",
  },
  {
    title: "Speed trend before/after ACE go-live",
    description: "Connects AVL speed archives with ACE enforcement timeline for student-favorite routes.",
    sql: "SELECT route_id, report_period, AVG(speed_mph) AS avg_speed, CASE WHEN report_period < ace_go_live THEN 'pre' ELSE 'post' END AS phase FROM bus_time_speeds JOIN ace_routes USING (route_id) WHERE route_id = ANY(@route_ids) GROUP BY 1,2,4 ORDER BY route_id, report_period;",
  },
];
