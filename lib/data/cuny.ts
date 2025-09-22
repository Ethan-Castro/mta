import { sql } from "@/lib/db";

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
