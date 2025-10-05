// Plain language glossary for MTA ACE terms
// This centralizes all jargon translations and explanations

export interface GlossaryTerm {
  id: string;
  technical: string;
  plain: string;
  explanation: string;
  example?: string;
  category: 'enforcement' | 'performance' | 'geography' | 'vehicles' | 'data';
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Enforcement Terms
  {
    id: 'ace',
    technical: 'ACE',
    plain: 'Camera-Monitored Bus Routes',
    explanation: 'Automated Camera Enforcement uses cameras to catch cars illegally blocking bus lanes, helping buses run faster and on time.',
    example: 'When a car parks in a bus lane on 14th Street, ACE cameras automatically take a photo and issue a ticket.',
    category: 'enforcement'
  },
  {
    id: 'ace-coverage',
    technical: 'ACE Coverage',
    plain: 'Routes with Camera Protection',
    explanation: 'The percentage of bus routes that have cameras watching for cars blocking bus lanes.',
    example: 'If 20 out of 100 bus routes have cameras, that\'s 20% ACE coverage.',
    category: 'enforcement'
  },
  {
    id: 'violations',
    technical: 'Violations',
    plain: 'Cars Caught Blocking Buses',
    explanation: 'Each time a camera catches a car illegally in a bus lane, blocking buses and slowing down passengers.',
    example: 'Last month, cameras caught 12,000 cars blocking bus lanes across the city.',
    category: 'enforcement'
  },
  {
    id: 'violation-trend',
    technical: 'Violation Trend',
    plain: 'Is the Problem Getting Better?',
    explanation: 'Whether more or fewer cars are blocking bus lanes over time. Fewer violations means buses run better.',
    example: 'A downward trend means drivers are learning to stay out of bus lanes.',
    category: 'enforcement'
  },

  // Performance Terms
  {
    id: 'speed-uplift',
    technical: 'Speed Uplift',
    plain: 'How Much Faster Buses Got',
    explanation: 'The improvement in bus speeds after cameras were installed to keep cars out of bus lanes.',
    example: 'A 15% speed uplift means a 20-minute trip now takes 17 minutes.',
    category: 'performance'
  },
  {
    id: 'bus-speed',
    technical: 'Average Bus Speed',
    plain: 'How Fast Buses Actually Move',
    explanation: 'How fast buses travel including all stops, traffic lights, and delays. Faster is better for passengers.',
    example: 'If buses average 8 mph, a 4-mile trip takes 30 minutes.',
    category: 'performance'
  },
  {
    id: 'reliability',
    technical: 'Service Reliability',
    plain: 'Buses Running On Time',
    explanation: 'How often buses arrive when they\'re supposed to. Higher reliability means less waiting.',
    example: '85% reliability means 85 out of 100 buses arrive within 2 minutes of schedule.',
    category: 'performance'
  },

  // Geography Terms
  {
    id: 'cbd',
    technical: 'CBD',
    plain: 'Downtown Manhattan',
    explanation: 'Central Business District - the busy part of Manhattan below 60th Street where most offices are located.',
    example: 'Areas like Times Square, Wall Street, and Union Square are all in the CBD.',
    category: 'geography'
  },
  {
    id: 'cbd-violations',
    technical: 'CBD Violations',
    plain: 'Downtown Traffic Problems',
    explanation: 'Cars illegally blocking bus lanes in Manhattan\'s busiest area, where traffic congestion hurts the most people.',
    example: 'A car blocking a bus lane near Penn Station affects hundreds of commuters.',
    category: 'geography'
  },
  {
    id: 'congestion-pricing',
    technical: 'Congestion Pricing',
    plain: 'Downtown Driving Fee',
    explanation: 'A fee for driving into the busiest part of Manhattan, designed to reduce traffic and improve bus service.',
    example: 'Drivers pay $15 to enter Manhattan below 60th Street during busy hours.',
    category: 'geography'
  },
  {
    id: 'hotspots',
    technical: 'Violation Hotspots',
    plain: 'Problem Areas',
    explanation: 'Specific locations where cars frequently block bus lanes, causing the most delays for passengers.',
    example: 'The intersection of 14th Street and 1st Avenue might be a hotspot if many violations happen there.',
    category: 'geography'
  },

  // Vehicle Terms
  {
    id: 'exempt-vehicles',
    technical: 'Exempt Vehicles',
    plain: 'Special Vehicles',
    explanation: 'Emergency vehicles, government cars, and other authorized vehicles that are allowed to use bus lanes.',
    example: 'Fire trucks, police cars, and city maintenance vehicles can legally use bus lanes.',
    category: 'vehicles'
  },
  {
    id: 'exempt-fleets',
    technical: 'Exempt Fleets',
    plain: 'Government Vehicle Groups',
    explanation: 'Organizations that own multiple vehicles with permission to use bus lanes, like police departments or hospitals.',
    example: 'The NYPD fleet includes hundreds of police cars that can use bus lanes during emergencies.',
    category: 'vehicles'
  },
  {
    id: 'repeaters',
    technical: 'Repeat Violators',
    plain: 'Problem Drivers',
    explanation: 'Vehicles or fleets that keep blocking bus lanes despite getting tickets, suggesting the system isn\'t working for them.',
    example: 'A delivery company that gets 50 bus lane tickets per month is a repeat violator.',
    category: 'vehicles'
  },

  // Data Terms
  {
    id: 'route-comparison',
    technical: 'Route Comparison',
    plain: 'Before vs After Analysis',
    explanation: 'Looking at how bus routes performed before and after cameras were installed to see if they\'re working.',
    example: 'Comparing the M15 bus route with cameras to similar routes without cameras.',
    category: 'data'
  },
  {
    id: 'student-exposure',
    technical: 'Student Exposure',
    plain: 'Students Affected Daily',
    explanation: 'How many CUNY students ride buses through areas being monitored, showing who benefits from better bus service.',
    example: '15,000 students ride monitored bus routes to get to college each day.',
    category: 'data'
  },
  {
    id: 'enforcement-effectiveness',
    technical: 'Enforcement Effectiveness',
    plain: 'Is It Working?',
    explanation: 'Whether camera enforcement is actually making buses faster and more reliable for passengers.',
    example: 'If bus speeds improved 10% after cameras were installed, enforcement is effective.',
    category: 'data'
  },

  // Real-time Dashboard Terms
  {
    id: 'exempt-share',
    technical: 'Exempt Share',
    plain: 'Percentage of Authorized Vehicles',
    explanation: 'What portion of vehicles in bus lanes are there legally (like ambulances and police cars) versus illegally blocking buses.',
    example: 'If 100 vehicles use a bus lane and 15 are emergency vehicles, the exempt share is 15%.',
    category: 'enforcement'
  },
  {
    id: 'sbs-route',
    technical: 'SBS',
    plain: 'Select Bus Service',
    explanation: 'Express bus routes with fewer stops and special bus lanes designed to be faster than regular buses.',
    example: 'The M15-SBS skips many stops and has its own lane on First Avenue, making it faster than the regular M15.',
    category: 'geography'
  },
  {
    id: 'route-watchlist',
    technical: 'Route Watchlist',
    plain: 'Most Active Routes',
    explanation: 'Bus routes with the highest number of cars caught blocking bus lanes, indicating where enforcement is most active.',
    example: 'If M15-SBS has 412 violations in a month, it appears at the top of the watchlist.',
    category: 'data'
  },
  {
    id: 'lookback-window',
    technical: 'Lookback Window',
    plain: 'Time Period Being Monitored',
    explanation: 'How far back in time the dashboard shows data, helping you see recent trends and patterns.',
    example: 'A 45-day lookback window shows all violations from the last month and a half.',
    category: 'data'
  },
  {
    id: 'system-pulse',
    technical: 'System Pulse',
    plain: 'Data & System Health',
    explanation: 'Real-time status showing whether all data sources and systems are working properly to provide accurate information.',
    example: 'Green status means databases and APIs are connected and delivering fresh data.',
    category: 'data'
  },
  {
    id: 'neon-warehouse',
    technical: 'Neon Data Warehouse',
    plain: 'Live Database Connection',
    explanation: 'The cloud database that stores and provides real-time violation data for the dashboard.',
    example: 'When connected to Neon, you see actual live data instead of sample data.',
    category: 'data'
  },
  {
    id: 'model-api',
    technical: 'Model API',
    plain: 'AI Analysis Service',
    explanation: 'Automated systems that analyze violation data and generate insights about bus lane enforcement patterns.',
    example: 'The Model API processes thousands of violations to identify trends and problem areas.',
    category: 'data'
  },
  {
    id: 'social-sentiment',
    technical: 'Social Sentiment',
    plain: 'Public Opinion Monitoring',
    explanation: 'Tracking what people are saying on social media about MTA service to understand public perception and issues.',
    example: 'If many people tweet about delays on a specific route, social sentiment monitoring flags it.',
    category: 'data'
  },
  {
    id: 'active-routes',
    technical: 'Active Routes',
    plain: 'Routes Being Monitored',
    explanation: 'Bus routes that have cameras actively recording violations during the selected time period.',
    example: 'If 25 routes recorded at least one violation this month, there are 25 active routes.',
    category: 'enforcement'
  }
];

// Helper functions for using the glossary
export function findTerm(id: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find(term => term.id === id);
}

export function getPlainLanguage(technicalTerm: string): string {
  const term = GLOSSARY_TERMS.find(t =>
    t.technical.toLowerCase() === technicalTerm.toLowerCase()
  );
  return term?.plain || technicalTerm;
}

export function getExplanation(id: string): string {
  const term = findTerm(id);
  return term?.explanation || '';
}

export function getTermsByCategory(category: GlossaryTerm['category']): GlossaryTerm[] {
  return GLOSSARY_TERMS.filter(term => term.category === category);
}

// Common term mappings for quick replacement
export const PLAIN_LANGUAGE_MAP: Record<string, string> = {
  'ACE': 'Camera-Monitored Routes',
  'CBD': 'Downtown Manhattan',
  'violations': 'cars caught blocking buses',
  'exempt vehicles': 'special vehicles',
  'speed uplift': 'how much faster buses got',
  'hotspots': 'problem areas',
  'route comparison': 'before vs after analysis',
  'student exposure': 'students affected daily',
  'congestion pricing': 'downtown driving fee',
  'enforcement effectiveness': 'is it working?'
};