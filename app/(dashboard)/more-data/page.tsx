import Link from "next/link"

export const metadata = {
  title: "More Data | NYC Transport Data",
  description:
    "Preview the NYC Transport Data open data roadmap and explore the city and state datasets that will power upcoming experiences.",
}

type DatasetLink = {
  label: string
  href: string
  description?: string
}

type DatasetGroup = {
  id: string
  title: string
  summary: string
  links: DatasetLink[]
}

const dotFeedGroups: DatasetGroup[] = [
  {
    id: "automated-enforcement",
    title: "Automated Enforcement",
    summary:
      "Photo enforcement, curb management, and license plate transparency data that inform safety programs across the five boroughs.",
    links: [
      {
        label: "Quarterly Unreadable License Plate Report - Q2 2025",
        href: "https://www.nyc.gov/html/dot/downloads/excel/quarterly-unreadable-license-plate-report-q2-2025.xlsx",
        description: "Local Law 155 of 2023 compliance data for Q2 2025.",
      },
      {
        label: "Quarterly Unreadable License Plate Report - Q1 2025",
        href: "https://www.nyc.gov/html/dot/downloads/excel/quarterly-unreadable-license-plate-report-q1-2025.xlsx",
        description: "Local Law 155 of 2023 compliance data for Q1 2025.",
      },
      {
        label: "Quarterly Unreadable License Plate Report - Q4 2024",
        href: "https://www.nyc.gov/html/dot/downloads/excel/quarterly-unreadable-license-plate-report-q4-2024.xlsx",
        description: "Local Law 155 of 2023 compliance data for Q4 2024.",
      },
      {
        label: "Quarterly Unreadable License Plate Report - Q3 2024",
        href: "https://www.nyc.gov/html/dot/downloads/excel/quarterly-unreadable-license-plate-report-q3-2024.xlsx",
        description: "Local Law 155 of 2023 compliance data for Q3 2024.",
      },
    ],
  },
  {
    id: "bicycles",
    title: "Bicycles",
    summary:
      "Bike counts, parking infrastructure, and bike share data that help track cycling trends and infrastructure needs.",
    links: [
      {
        label: "Bicycle Counts",
        href: "https://www.nyc.gov/html/dot/html/bicyclists/bikestats.shtml#counts",
        description: "Regular bike counts at various locations throughout the city.",
      },
      {
        label: "Bike Parking Data on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/Bicycle-Parking/yh4a-g3fj",
        description: "Free bicycle parking racks installed on sidewalks.",
      },
      {
        label: "Bike Shelters Data on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/Bicycle-Parking-Shelters/thbt-gfu9",
        description: "Bicycle parking shelter locations and information.",
      },
      {
        label: "Citi Bike System Data",
        href: "http://citibikenyc.com/system-data",
        description: "Trip records, station status, and monthly reports from NYC Bike Share.",
      },
      {
        label: "Citi Bike Station Status Feed (JSON)",
        href: "https://gbfs.citibikenyc.com/gbfs/en/station_status.json",
        description: "Real-time station status and availability.",
      },
      {
        label: "Bicycle Route Layer on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/Bicycle-Routes/7vsa-caz7",
        description: "Geodata for NYC bike routes and network.",
      },
    ],
  },
  {
    id: "bridges",
    title: "Bridges",
    summary:
      "Bridge ratings, condition reports, and maintenance data for NYC's nearly 800 bridges and tunnels.",
    links: [
      {
        label: "Bridge Ratings (ZIP)",
        href: "https://www.nyc.gov/html/dot/downloads/misc/bridge-ratings-datafeeds.zip",
        description: "Downloadable bridge condition and rating data.",
      },
      {
        label: "Bridge Ratings on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/Bridge-Ratings/4yue-vjfc",
        description: "Information and condition of bridges in New York.",
      },
    ],
  },
  {
    id: "bus-lanes",
    title: "Bus Lanes and Electronic Signs",
    summary:
      "Bus lane locations and real-time passenger information systems that improve transit reliability.",
    links: [
      {
        label: "Bus Lane Locations on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/Bus-Lanes-Local-Streets/ycrg-ses3",
        description: "Locations of bus lanes that separate buses from general traffic.",
      },
      {
        label: "RTPI Sign Locations on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/Real-Time-Passenger-Information-Sign-Locations/g9jx-npbk",
        description: "Real-time bus arrival information sign locations.",
      },
    ],
  },
  {
    id: "ferry",
    title: "Ferry",
    summary:
      "Staten Island Ferry schedules, ridership data, and performance metrics for ferry operations.",
    links: [
      {
        label: "Staten Island Ferry GTFS Dataset (ZIP)",
        href: "https://www.nyc.gov/html/dot/downloads/misc/siferry-gtfs.zip",
        description: "General Transit Feed Specification for ferry schedules.",
      },
      {
        label: "Private Ferry Monthly Ridership",
        href: "https://nycdot.sharepoint.com/:f:/s/publicshare/EndgcKRvbIZKoBhK_I3lWIQBUFSJBl6drQPWVT5q1n4Auw",
        description: "Monthly ridership data for private ferry services.",
      },
      {
        label: "Staten Island Ferry Daily Performance",
        href: "https://nycdot.sharepoint.com/:f:/s/publicshare/En68isyTFkBDg8lm9UaNcHoBbasMca_nDvlO0ye8FyyHsw?e=JbLG7h",
        description: "Daily performance metrics for Staten Island Ferry.",
      },
    ],
  },
  {
    id: "freight-mobility",
    title: "Freight Mobility",
    summary:
      "Truck route data and freight mobility information for NYC's nearly 1,000 miles of truck routes.",
    links: [
      {
        label: "Truck Route Layer on NYC Open Data",
        href: "https://data.cityofnewyork.us/dataset/NYC-Truck-Routes/spax-mybh/data",
        description: "Centerlines of through and local truck routes.",
      },
      {
        label: "All Truck Routes NYC (ZIP)",
        href: "https://www.nyc.gov/html/dot/downloads/misc/all_truck_routes_nyc.zip",
        description: "Complete truck route dataset for download.",
      },
    ],
  },
  {
    id: "parking",
    title: "Parking",
    summary:
      "Parking permits, meter rates, and regulations data that inform parking policy and enforcement.",
    links: [
      {
        label: "City-issued Parking Permits 2023-2024 (XLSX)",
        href: "https://www.nyc.gov/html/dot/downloads/excel/local-law-9-data-2023-2024.xlsx",
        description: "Local Law 9 of 2020 compliance data for parking permits.",
      },
      {
        label: "Parking Meter Rates by Blockface Segments",
        href: "https://data.cityofnewyork.us/Transportation/Parking-Meters-ParkNYC-Blockfaces/s7zi-dgdx",
        description: "Individual meter rates by block face segments.",
      },
      {
        label: "Parking Meter Rates by Large Geographic Areas",
        href: "https://data.cityofnewyork.us/Transportation/Parking-Meters-Citywide-Rate-Zones/da76-p95d",
        description: "Parking meter rates by large geographic areas.",
      },
      {
        label: "Parking Regulations on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/Parking-Regulation-Locations-and-Signs/nfid-uabd",
        description: "Location and description of parking signs throughout the city.",
      },
    ],
  },
  {
    id: "public-space",
    title: "Public Space",
    summary:
      "Seating locations, pedestrian plazas, and wayfinding systems that enhance public space accessibility.",
    links: [
      {
        label: "Seating Locations on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/Seating-Locations/esmy-s8q5",
        description: "Benches and leaning bars on sidewalks and plazas.",
      },
      {
        label: "Pedestrian Plaza Locations on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/NYC-DOT-Pedestrian-Plazas/k5k6-6jex",
        description: "Neighborhood plazas throughout the city.",
      },
      {
        label: "Street Seats Locations on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/Street-Seats/d83i-6us7",
        description: "Seasonal street seating installations.",
      },
      {
        label: "WalkNYC Sign Locations on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/WalkNYC-Sign-Locations/q49j-2bun",
        description: "NYC's wayfinding system sign locations.",
      },
    ],
  },
  {
    id: "traffic-counts",
    title: "Vehicle and Pedestrian Counts",
    summary:
      "Traffic volume data, pedestrian counts, and transportation data collection calendars.",
    links: [
      {
        label: "2025 Transportation Data Collection Calendar (XLSX)",
        href: "https://www.nyc.gov/html/dot/downloads/misc/transportation-data-collection-calendar.xlsx",
        description: "Calendar for field data collection periods.",
      },
      {
        label: "Bi-Annual Pedestrian Counts (SHP)",
        href: "https://www.nyc.gov/html/dot/downloads/misc/nycdot-bi-annual-pedestrian-index.zip",
        description: "Pedestrian volume index data in shapefile format.",
      },
      {
        label: "Bi-Annual Pedestrian Counts (XLSX)",
        href: "https://www.nyc.gov/html/dot/downloads/misc/nycdot-bi-annual-pedestrian-index.xlsx",
        description: "Pedestrian volume index data in Excel format.",
      },
      {
        label: "Traffic Volume Counts on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/Traffic-Volume-Counts/btm5-ppia",
        description: "Vehicle traffic volume data.",
      },
      {
        label: "Comprehensive Traffic Volume Counts on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/Automated-Traffic-Volume-Counts/7ym2-wayt",
        description: "Automated traffic volume counting data.",
      },
    ],
  },
  {
    id: "street-construction",
    title: "Street Construction and Design",
    summary:
      "Protected streets, capital projects, pavement ratings, and street network changes.",
    links: [
      {
        label: "Protected Streets - Block Dataset",
        href: "https://data.cityofnewyork.us/Transportation/Protected-Streets-Map-Block-Dataset-/wyih-3nzf",
        description: "Blocks resurfaced or reconstructed within the last five years.",
      },
      {
        label: "Protected Streets - Intersection Dataset",
        href: "https://data.cityofnewyork.us/Transportation/Protected-Streets-Map-Intersection-Dataset-/bryy-vqd9",
        description: "Intersections resurfaced or reconstructed within the last five years.",
      },
      {
        label: "Street and Highway Capital Reconstruction Projects - Block Data",
        href: "https://data.cityofnewyork.us/Transportation/Street-and-Highway-Capital-Reconstruction-Projects/jvk9-k4re",
        description: "Major street construction projects by block.",
      },
      {
        label: "Street and Highway Capital Reconstruction Projects - Intersection Data",
        href: "https://data.cityofnewyork.us/Transportation/Street-and-Highway-Capital-Reconstruction-Projects/97nd-ff3i",
        description: "Major street construction projects by intersection.",
      },
      {
        label: "Street Assessment/Street Pavement Ratings on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/Street-Pavement-Rating/6yyb-pb25",
        description: "Street condition ratings on a scale from 1 to 10.",
      },
      {
        label: "Street Network Changes 2015-Present (XLS)",
        href: "https://www.nyc.gov/html/dot/downloads/excel/street-network-changes.xlsx",
        description: "One-way conversions, reversals, and two-way conversions.",
      },
      {
        label: "Street Pothole Work Orders - Closed on NYC Open Data",
        href: "https://data.cityofnewyork.us/Transportation/Street-Pothole-Work-Orders-Closed-Dataset-/x9wy-ing4",
        description: "Closed street potholes inspected and repaired by NYC DOT.",
      },
    ],
  },
  {
    id: "real-time-traffic",
    title: "Real-Time Traffic",
    summary:
      "Traffic cameras, speed data, and real-time traffic management information.",
    links: [
      {
        label: "Traffic Speed (CSV)",
        href: "http://207.251.86.229/nyc-links-cams/LinkSpeedQuery.txt",
        description: "Real-time traffic speed data from sensors throughout the city.",
      },
      {
        label: "Traffic Speed (KML)",
        href: "http://207.251.86.229/nyc-links-cams/TrafficSpeed.php",
        description: "Traffic speed data in KML format for mapping applications.",
      },
    ],
  },
  {
    id: "vision-zero",
    title: "Vision Zero",
    summary:
      "Traffic crash data, safety initiatives, and Vision Zero program information.",
    links: [
      {
        label: "Traffic Crash Data on NYC Open Data",
        href: "https://data.cityofnewyork.us/Public-Safety/NYPD-Motor-Vehicle-Collisions/h9gi-nx95",
        description: "Motor vehicle collision data from NYPD.",
      },
      {
        label: "All other Vision Zero View data on NYC Open Data",
        href: "https://data.cityofnewyork.us/browse?q=VZV&sortBy=relevance",
        description: "Street design projects, outreach events, and speed limits.",
      },
    ],
  },
]

const mtaCollections: DatasetGroup[] = [
  {
    id: "capital-programs",
    title: "Capital Programs & Assets",
    summary:
      "Long-range needs assessments and capital dashboards that describe where the MTA is investing across agencies.",
    links: [
      {
        label: "MTA Capital Dashboard - Agencies Detail",
        href: "https://data.ny.gov/d/kizb-nxtu",
        description: "Projects in MTA's 5-Year Capital Programs with quarterly updates.",
      },
      {
        label: "MTA Capital Dashboard - Agencies Summary",
        href: "https://data.ny.gov/d/ehz8-ag3n",
        description: "Summary view of capital program projects and budgets.",
      },
      {
        label: "MTA Capital Dashboard - Project Locations",
        href: "https://data.ny.gov/d/wcsa-vkhf",
        description: "Geo-coordinates for capital projects where applicable.",
      },
      {
        label: "MTA 2025-2029 Capital Plan ACEP Projects",
        href: "https://data.ny.gov/d/6ifx-7aaq",
        description: "Capital investments in the 2025-2029 Capital Plan.",
      },
      {
        label: "MTA 2025-2044 20-Year Needs Assessment Asset Condition",
        href: "https://data.ny.gov/d/qsdd-gb3s",
        description: "Asset conditions across the MTA system for long-term planning.",
      },
      {
        label: "MTA 2025-2044 20-Year Needs Assessment Bus Fleet Inventory",
        href: "https://data.ny.gov/d/pssf-s7fa",
        description: "Revenue bus fleets and planned orders by type and power source.",
      },
      {
        label: "MTA 2025-2044 20-Year Needs Assessment Railcar Fleet Inventory",
        href: "https://data.ny.gov/d/hjck-ty8r",
        description: "All revenue fleets with fleet type, units, and useful life data.",
      },
    ],
  },
  {
    id: "bus-performance",
    title: "Bus Performance & Reliability",
    summary:
      "Speed, ridership, and enforcement feeds that underpin corridor analysis and congestion pricing reporting.",
    links: [
      {
        label: "MTA Bus Route Segment Speeds: 2023-2024",
        href: "https://data.ny.gov/d/58t6-89vi",
        description: "Average speeds between timepoints for every bus route.",
      },
      {
        label: "MTA Bus Route Segment Speeds: Beginning 2025",
        href: "https://data.ny.gov/d/kufs-yh3x",
        description: "Current year bus route segment speed data.",
      },
      {
        label: "MTA Bus Hourly Ridership: 2020-2024",
        href: "https://data.ny.gov/d/kv7t-n8in",
        description: "Bus ridership estimates by route and fare payment class.",
      },
      {
        label: "MTA Bus Hourly Ridership: Beginning 2025",
        href: "https://data.ny.gov/d/gxb3-akrn",
        description: "Current year hourly bus ridership data.",
      },
      {
        label: "MTA Bus Automated Camera Enforcement Violations",
        href: "https://data.ny.gov/d/kh8p-hcbm",
        description: "Violations for vehicles blocking bus lanes or double parked.",
      },
      {
        label: "MTA Bus Customer Journey-Focused Metrics: 2020-2024",
        href: "https://data.ny.gov/d/wrt8-4b59",
        description: "Additional stop time, travel time, and journey performance.",
      },
      {
        label: "MTA Bus Customer Journey-Focused Metrics: Beginning 2025",
        href: "https://data.ny.gov/d/k5f7-e4wr",
        description: "Current year customer journey performance metrics.",
      },
      {
        label: "MTA Bus Service Delivered: 2020-2024",
        href: "https://data.ny.gov/d/2e6s-9gpm",
        description: "Percentage of scheduled buses provided during peak hours.",
      },
      {
        label: "MTA Bus Service Delivered: Beginning 2025",
        href: "https://data.ny.gov/d/6qwi-vjde",
        description: "Current year service delivery performance.",
      },
      {
        label: "MTA Bus Speeds: 2020-2024",
        href: "https://data.ny.gov/d/6ksi-7cxr",
        description: "How quickly buses travel along their routes.",
      },
      {
        label: "MTA Bus Speeds: Beginning 2025",
        href: "https://data.ny.gov/d/4u4b-jge6",
        description: "Current year bus speed performance.",
      },
      {
        label: "MTA Bus Wait Assessment: 2020-2024",
        href: "https://data.ny.gov/d/swky-c3v4",
        description: "How evenly buses are spaced along routes.",
      },
      {
        label: "MTA Bus Wait Assessment: Beginning 2025",
        href: "https://data.ny.gov/d/v4z4-2h6n",
        description: "Current year bus wait assessment metrics.",
      },
    ],
  },
  {
    id: "bridges-tunnels",
    title: "Bridges & Tunnels",
    summary:
      "Crossings, response times, and congestion relief analytics sourced from Bridges & Tunnels operations.",
    links: [
      {
        label: "MTA Bridges and Tunnels Hourly Crossings",
        href: "https://data.ny.gov/d/ebfx-2m7v",
        description: "Hourly crossings by facility, direction, vehicle class, and payment method.",
      },
      {
        label: "MTA Bridges and Tunnels Incident Response Times",
        href: "https://data.ny.gov/d/426z-f5nc",
        description: "Monthly incident response data from B&T facilities.",
      },
      {
        label: "MTA Bridges and Tunnels Collisions",
        href: "https://data.ny.gov/d/2wqd-qady",
        description: "Information on collisions at B&T facilities.",
      },
      {
        label: "MTA Bridges and Tunnels Summonses",
        href: "https://data.ny.gov/d/kbnz-4kmf",
        description: "Summonses issued for violations on B&T facilities.",
      },
      {
        label: "MTA Bridges and Tunnels Safety Indicators",
        href: "https://data.ny.gov/d/7h37-mvq2",
        description: "Various safety indicators and targets for B&T.",
      },
      {
        label: "MTA Congestion Relief Zone Vehicle Entries",
        href: "https://data.ny.gov/d/t6yz-b64h",
        description: "Crossings into the Congestion Relief Zone by location and vehicle class.",
      },
      {
        label: "MTA Central Business District Geofence",
        href: "https://data.ny.gov/d/srxy-5nxn",
        description: "2D geofence polygons for Manhattan CBD as defined by legislation.",
      },
      {
        label: "MTA Central Business District Vehicle Speeds",
        href: "https://data.ny.gov/d/6p29-6xqn",
        description: "Average vehicle speeds in CBD, adjacent areas, and rest of NYC.",
      },
    ],
  },
  {
    id: "ridership",
    title: "Ridership & Customer Experience",
    summary:
      "Systemwide ridership trends, accessibility metrics, and customer feedback that guide experience design.",
    links: [
      {
        label: "MTA Daily Ridership and Traffic: Beginning 2020",
        href: "https://data.ny.gov/d/sayj-mze2",
        description: "Systemwide ridership and traffic estimates for all MTA services.",
      },
      {
        label: "MTA Monthly Ridership / Traffic Data: Beginning January 2008",
        href: "https://data.ny.gov/d/xfre-bxip",
        description: "Monthly ridership and traffic estimates across all MTA agencies.",
      },
      {
        label: "MTA LIRR Elevator and Escalator Availability",
        href: "https://data.ny.gov/d/9hjt-526f",
        description: "Percent of time elevators and escalators are operational systemwide.",
      },
      {
        label: "MTA Metro-North Elevator and Escalator Availability",
        href: "https://data.ny.gov/d/ax67-8386",
        description: "Elevator and escalator availability for Metro-North system.",
      },
      {
        label: "MTA Customer Feedback Data: 2014-2019",
        href: "https://data.ny.gov/d/tppa-s6t6",
        description: "Customer feedback submitted by transit system riders.",
      },
      {
        label: "MTA Bus Fare Evasion: Beginning 2019",
        href: "https://data.ny.gov/d/uv5h-dfhp",
        description: "Estimated percentage of riders who illegally board buses.",
      },
      {
        label: "MTA Bus Wheelchair Ramp/Lift Usage: Beginning 2017",
        href: "https://data.ny.gov/d/e2u6-bmnn",
        description: "Number of wheelchair ramp or lift deployments on buses monthly.",
      },
    ],
  },
  {
    id: "rail-performance",
    title: "Rail Performance & Reliability",
    summary:
      "LIRR and Metro-North performance metrics, delays, and service reliability indicators.",
    links: [
      {
        label: "MTA LIRR Delays: Beginning 2010",
        href: "https://data.ny.gov/d/e32g-kbe9",
        description: "LIRR train delays with specific delay cause categories.",
      },
      {
        label: "MTA LIRR On-Time Performance: Beginning 2015",
        href: "https://data.ny.gov/d/6kq9-5ikh",
        description: "Frequency of trains arriving within 5 minutes 59 seconds of scheduled time.",
      },
      {
        label: "MTA LIRR Service Delivered: Beginning 2019",
        href: "https://data.ny.gov/d/hpua-e653",
        description: "Ability to deliver scheduled service and capacity versus actual service.",
      },
      {
        label: "MTA LIRR Mean Distance Between Failures: Beginning 2015",
        href: "https://data.ny.gov/d/cpjs-d6ua",
        description: "Miles a rail car travels before mechanical failure causes delay.",
      },
      {
        label: "MTA LIRR Safety and Grade Crossing Incidents: Beginning 2019",
        href: "https://data.ny.gov/d/ka57-re2h",
        description: "Safety performance metrics and incident counts for LIRR.",
      },
      {
        label: "MTA Metro-North Delays: Beginning 2012",
        href: "https://data.ny.gov/d/tgiq-jafi",
        description: "Metro-North train delays with specific delay cause categories.",
      },
      {
        label: "MTA Metro-North On-Time Performance: Beginning 2020",
        href: "https://data.ny.gov/d/83hw-i6xw",
        description: "Metro-North on-time performance metrics.",
      },
      {
        label: "MTA Metro-North Service Delivered: Beginning January 2019",
        href: "https://data.ny.gov/d/jt9p-47ua",
        description: "Metro-North service delivery performance metrics.",
      },
      {
        label: "MTA Metro-North Mean Distance Between Failures: Beginning 2018",
        href: "https://data.ny.gov/d/4qd6-ptxx",
        description: "Metro-North rail car reliability metrics.",
      },
    ],
  },
  {
    id: "financial-operations",
    title: "Financial & Operations",
    summary:
      "Debt, fuel hedging, employee data, and operational metrics that support MTA financial planning.",
    links: [
      {
        label: "MTA Debt Outstanding",
        href: "https://data.ny.gov/d/sze3-m8qh",
        description: "Detailed information on MTA's outstanding principal from bond issuances.",
      },
      {
        label: "MTA Fuel Hedging",
        href: "https://data.ny.gov/d/dips-jfpb",
        description: "Weighted average fuel prices and forecasted fuel purchases.",
      },
      {
        label: "MTA Employee Availability: Beginning 2013",
        href: "https://data.ny.gov/d/pfh5-epwm",
        description: "Proportion of employee scheduled time spent on productive work.",
      },
      {
        label: "MTA Headcount: Beginning 2024",
        href: "https://data.ny.gov/d/ui26-n8p4",
        description: "Actual and projected monthly headcount data by agency and function.",
      },
      {
        label: "MTA Major Felonies",
        href: "https://data.ny.gov/d/yeek-jhmu",
        description: "Count of arrests for seven major felony offenses within the MTA system.",
      },
    ],
  },
]

const partnerResources: DatasetLink[] = [
  {
    label: "NYC Open Data Portal",
    href: "https://nycopendata.socrata.com/",
    description: "Citywide APIs and datasets from agencies across New York City.",
  },
  {
    label: "NYC DOT Data Feeds Directory",
    href: "https://www.nyc.gov/html/dot/html/about/datafeeds.shtml#_content",
    description: "Primary index of DOT transportation datasets and reports.",
  },
  {
    label: "Open NY Catalog (Statewide)",
    href: "https://data.ny.gov/browse",
    description: "State-managed datasets including the full MTA collection.",
  },
  {
    label: "MTA Data Catalog on Open NY",
    href: "https://data.ny.gov/browse?Dataset-Information_Agency=Metropolitan+Transportation+Authority&sortBy=alpha&pageSize=100&limitTo=datasets&page=1",
    description: "Complete MTA dataset collection on the state open data portal.",
  },
  {
    label: "NYC DOT Data Feeds - Skip Navigation",
    href: "https://www.nyc.gov/html/dot/html/about/datafeeds.shtml#_content",
    description: "Direct access to NYC DOT data feeds, bypassing navigation.",
  },
  {
    label: "NYC Open Data Terms of Use",
    href: "https://www.nyc.gov/home/terms-of-use.page",
    description: "Usage, attribution, and disclaimer requirements for redistribution.",
  },
  {
    label: "NYC DOT Bridge and Tunnel Condition Report",
    href: "https://www.nyc.gov/html/dot/html/infrastructure/annualbridgereport.shtml",
    description: "Annual report on bridge and tunnel conditions across NYC.",
  },
  {
    label: "NYC DOT Transportation Data Collection Calendar",
    href: "https://www.nyc.gov/html/dot/downloads/pdf/transportation-data-collection-memo.pdf",
    description: "Guidelines for field data collection periods and timing.",
  },
  {
    label: "Vision Zero View Map",
    href: "http://www.vzv.nyc/",
    description: "Interactive tool showing traffic injuries, fatal crashes, and safety initiatives.",
  },
  {
    label: "NYC DOT Traffic Management Center",
    href: "https://nyctmc.org/",
    description: "Real-time traffic cameras and speed data throughout the five boroughs.",
  },
]

function DatasetGroupSection({ group }: { group: DatasetGroup }) {
  return (
    <section
      aria-labelledby={`${group.id}-heading`}
      className="rounded-xl border border-border/40 bg-card text-card-foreground shadow-sm"
    >
      <div className="space-y-4 p-6">
        <div className="space-y-2">
          <h3 id={`${group.id}-heading`} className="text-lg font-semibold tracking-tight">
            {group.title}
          </h3>
          <p className="text-sm text-muted-foreground">{group.summary}</p>
        </div>
        <ul className="space-y-3 text-sm">
          {group.links.map((link) => (
            <li key={link.href} className="leading-6">
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {link.label}
              </a>
              {link.description ? (
                <span className="block text-muted-foreground">{link.description}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function MoreDataPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-6 rounded-xl border border-border/40 bg-muted/20 p-6 shadow-sm">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">More Data on the Horizon</h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            This website is being slowly converted to an open data transportation website. The datasets listed below are set to be factored in as we expand NYC Transport Data into a comprehensive open data transportation hub. These resources are slated for integration into interactive dashboards, conversational tools, and downloadable pipeline outputs. We are prioritizing structured metadata, quality flags, and consistent refresh cadences so the same datasets can support both expert workflows and accessible storytelling.
          </p>
        </div>
        <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
            Unified ingestion pipelines for NYC DOT, MTA, and partner agencies.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
            Accessibility-first presentation, including screen reader friendly tables and alt text.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
            Transparent refresh notes and quality disclaimers surfaced with each dataset.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
            Downloadable slices that mirror the metrics used in executive and operations dashboards.
          </li>
        </ul>
      </section>

      <section className="space-y-5">
        <header className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">NYC DOT Data Feeds</h2>
          <p className="text-sm text-muted-foreground">
            Core city datasets that anchor street design, safety, and curb management analyses.
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
          {dotFeedGroups.map((group) => (
            <DatasetGroupSection key={group.id} group={group} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <header className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">MTA Open Data Collections</h2>
          <p className="text-sm text-muted-foreground">
            State-managed feeds focused on capital delivery, network performance, and rider experience.
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
          {mtaCollections.map((group) => (
            <DatasetGroupSection key={group.id} group={group} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <header className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Foundational Resources</h2>
          <p className="text-sm text-muted-foreground">
            Bookmark these hubs for terms of use, multilingual access, and the full catalog of transportation open data.
          </p>
        </header>
        <ul className="grid gap-4 sm:grid-cols-2">
          {partnerResources.map((resource) => (
            <li key={resource.href} className="rounded-xl border border-border/40 bg-card p-5 shadow-sm">
              <div className="space-y-2">
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {resource.label}
                </a>
                {resource.description ? (
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-border/40 bg-muted/10 p-6 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Reminder:</strong> NYC DOT and the City of New York make no representation as to the accuracy of redistributed datasets. Always confirm posted signage and refer to the latest terms of use before building operational workflows. We publish refresh notes and caveats alongside each integration to keep this site transparent and audit-friendly.
        </p>
        <p>
          Questions about data coverage or refresh priorities? Reach out through the feedback link in the navigation or email
          <a className="text-primary underline-offset-4 hover:underline" href="mailto:data@nyctransport.dev">data@nyctransport.dev</a>.
        </p>
        <p>
          Need to bypass navigation? Use the global "Skip to main content" link at the top of every page or press
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">Cmd/Ctrl</kbd>
          <span aria-hidden className="mx-1 text-muted-foreground">+</span>
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">B</kbd> to toggle the sidebar.
        </p>
        <p>
          Looking for embedded NYS Open Data experiences such as the statewide catalog navigation? Visit the
          <Link className="text-primary underline-offset-4 hover:underline" href="/presentation">
            presentation workspace
          </Link>
          for curated demonstrations while we continue the full migration.
        </p>
      </section>
    </div>
  )
}

