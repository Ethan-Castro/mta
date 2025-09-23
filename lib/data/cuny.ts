import { sql, isDbConfigured } from "@/lib/db";

export type Campus = {
  type: string;
  campus: string;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
};

export async function getCampuses(): Promise<Campus[]> {
  if (!isDbConfigured) {
    // Return sample data when database is not available
    return [
      {
        type: "Senior College",
        campus: "Baruch College",
        website: "https://www.baruch.cuny.edu",
        address: "55 Lexington Ave",
        city: "New York",
        state: "NY",
        zip: "10010",
        latitude: 40.7406,
        longitude: -73.9838,
      },
      {
        type: "Senior College",
        campus: "Brooklyn College",
        website: "https://www.brooklyn.cuny.edu",
        address: "2900 Bedford Ave",
        city: "Brooklyn",
        state: "NY",
        zip: "11210",
        latitude: 40.6324,
        longitude: -73.9529,
      },
      {
        type: "Senior College",
        campus: "City College",
        website: "https://www.ccny.cuny.edu",
        address: "160 Convent Ave",
        city: "New York",
        state: "NY",
        zip: "10031",
        latitude: 40.8193,
        longitude: -73.9502,
      },
    ];
  }

  const rows = await sql`
    select
      institution_type,
      campus,
      campus_website,
      address,
      city,
      state,
      zip,
      latitude,
      longitude
    from cuny_campus_locations
    order by campus
  `;

  return (rows as Array<{ [key: string]: any }>).map((row) => ({
    type: row.institution_type,
    campus: row.campus,
    website: row.campus_website,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
  }));
}
